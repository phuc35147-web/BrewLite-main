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
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow">
          <h1 className="text-3xl font-bold text-amber-900">
            {isRegister ? 'Đăng ký BrewLite' : 'Đăng nhập BrewLite'}
          </h1>

          {error && (
            <div className="mt-4 rounded-lg bg-red-100 p-3 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {isRegister && (
              <div>
                <label className="mb-2 block font-medium">
                  Họ tên (không bắt buộc)
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3"
                  placeholder="Nhập họ tên"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block font-medium">Email</label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border px-4 py-3"
                placeholder="Nhập email"
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">Mật khẩu</label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border px-4 py-3"
                placeholder={
                  isRegister ? 'Ít nhất 6 ký tự' : 'Nhập mật khẩu'
                }
                required
                minLength={isRegister ? 6 : undefined}
              />
            </div>

            {isRegister && (
              <div>
                <label className="mb-2 block font-medium">
                  Nhập lại mật khẩu
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3"
                  placeholder="Nhập lại mật khẩu"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-amber-700 px-6 py-3 font-semibold text-white disabled:bg-gray-400"
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

          <p className="mt-6 text-center text-sm text-gray-600">
            {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
            <button
              type="button"
              onClick={() => switchMode(isRegister ? 'login' : 'register')}
              className="font-semibold text-amber-700 hover:underline"
            >
              {isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
