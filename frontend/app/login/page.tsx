'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';

type Mode = 'login' | 'register';

function messageOf(data: { message?: string | string[] }, fallback: string) {
  return Array.isArray(data.message)
    ? data.message.join(', ')
    : data.message || fallback;
}

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  // Gọi /auth/login, lưu token + thông tin user, rồi về trang chủ.
  const login = async () => {
    const response = await fetch(apiUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(messageOf(data, 'Đăng nhập thất bại'));
    }

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    router.push('/');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');

      if (isRegister) {
        if (password.length < 6) {
          throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
        }
        if (password !== confirmPassword) {
          throw new Error('Mật khẩu nhập lại không khớp');
        }

        const response = await fetch(apiUrl('/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            ...(name.trim() ? { name: name.trim() } : {}),
          }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(messageOf(data, 'Đăng ký thất bại'));
        }
      }

      // Đăng nhập luôn sau khi đăng ký thành công.
      await login();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isRegister
            ? 'Đăng ký thất bại'
            : 'Đăng nhập thất bại',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container page-space">
      <div className="auth-page"><section className="auth-art"><div className="eyebrow">BREWLITE COFFEE HOUSE</div><h2>Một ly ngon, một khoảnh khắc đáng nhớ.</h2><p>Cà phê pha mới mỗi ngày, dành riêng cho bạn.</p></section><div className="auth-content"><div className="auth-form">
          <h1>
            {isRegister ? 'Đăng ký BrewLite' : 'Đăng nhập BrewLite'}
          </h1>

          {error && (
            <div className="error-note">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-fields">
            {isRegister && (
              <div className="field">
                <label>
                  Họ tên (không bắt buộc)
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-wrap"
                  placeholder="Nhập họ tên"
                />
              </div>
            )}

              <div className="field">
              <label>Email</label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-wrap"
                placeholder="Nhập email"
                required
              />
            </div>

              <div className="field">
              <label>Mật khẩu</label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-wrap"
                placeholder={
                  isRegister ? 'Ít nhất 6 ký tự' : 'Nhập mật khẩu'
                }
                required
                minLength={isRegister ? 6 : undefined}
              />
            </div>

            {isRegister && (
              <div className="field">
                <label>
                  Nhập lại mật khẩu
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-wrap"
                  placeholder="Nhập lại mật khẩu"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary wide"
            >
              {loading
                ? isRegister
                  ? 'Đang đăng ký...'
                  : 'Đang đăng nhập...'
                : isRegister
                  ? 'Đăng ký'
                  : 'Đăng nhập'}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
            <button
              type="button"
              onClick={() => switchMode(isRegister ? 'login' : 'register')}
              className="auth-toggle"
            >
              {isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}
            </button>
          </p>
        </div></div></div>
    </main>
  );
}
