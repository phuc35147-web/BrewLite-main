import { Connection, Request } from 'tedious';

const server = process.env.DB_SERVER || 'sqlserver';
const port = Number(process.env.DB_PORT || 1433);
const user = process.env.DB_USER || 'sa';
const password = process.env.DB_PASSWORD || 'BrewLite@2026!';
const dbName = process.env.DB_NAME || 'BrewLite';

const config = {
  server,
  authentication: {
    type: 'default',
    options: {
      userName: user,
      password: password,
    },
  },
  options: {
    port,
    database: dbName,
    encrypt: true,
    trustServerCertificate: true,
    connectTimeout: 10000,
  },
};

function executeSql(connection, sql) {
  return new Promise((resolve, reject) => {
    const rows = [];
    const request = new Request(sql, (err, rowCount) => {
      if (err) return reject(err);
      resolve({ rowCount, rows });
    });

    request.on('row', (columns) => {
      const row = {};
      columns.forEach((col) => {
        row[col.metadata.colName] = col.value;
      });
      rows.push(row);
    });

    connection.execSql(request);
  });
}

async function main() {
  const connection = new Connection(config);

  await new Promise((resolve, reject) => {
    connection.on('connect', (err) => {
      if (err) return reject(err);
      resolve();
    });
    connection.on('error', () => {});
    connection.connect();
  });

  try {
    console.log(`[seed] Checking products in database [${dbName}]...`);
    const seedSql = `
      IF NOT EXISTS (SELECT 1 FROM [dbo].[Product] WHERE [name] = N'Cà phê sữa')
      BEGIN
        INSERT INTO [dbo].[Product]
        ([name], [description], [price], [imageUrl], [stock], [isActive], [createdAt], [updatedAt])
        VALUES
        (N'Cà phê sữa', N'Cà phê sữa truyền thống đậm đà chuẩn vị', 35000, N'/images/ca-phe-sua.jpg', 50, 1, GETDATE(), GETDATE()),
        (N'Americano', N'Americano đá thanh nhẹ, đậm vị cà phê mộc', 40000, N'/images/americano.jpg', 50, 1, GETDATE(), GETDATE()),
        (N'Cappuccino', N'Cappuccino bọt sữa mịn màng, thơm béo', 45000, N'/images/cappuccino.jpg', 35, 1, GETDATE(), GETDATE()),
        (N'Trà đào cam sả', N'Trà đào thanh mát quyện cùng cam sả thơm lừng', 39000, N'/images/tra-dao.jpg', 40, 1, GETDATE(), GETDATE());
      END

      IF NOT EXISTS (SELECT 1 FROM [dbo].[Product] WHERE [name] = N'Bạc xỉu ba tầng')
      BEGIN
        INSERT INTO [dbo].[Product]
        ([name], [description], [price], [imageUrl], [stock], [isActive], [createdAt], [updatedAt])
        VALUES
        (N'Bạc xỉu ba tầng', N'Nhiều sữa ít cà phê, ngọt béo dịu dàng thơm ngậy', 35000, NULL, 45, 1, GETDATE(), GETDATE()),
        (N'Cà phê muối xứ Huế', N'Lớp kem béo mặn hòa cùng cà phê đậm đặc biệt', 42000, NULL, 40, 1, GETDATE(), GETDATE()),
        (N'Cà phê đen đá', N'Cà phê Robusta nguyên chất đậm vị truyền thống', 30000, NULL, 55, 1, GETDATE(), GETDATE()),
        (N'Matcha Latte', N'Trà xanh Nhật Bản thượng hạng kết hợp sữa tươi thanh trùng', 49000, NULL, 30, 1, GETDATE(), GETDATE()),
        (N'Trà sữa ô long nướng', N'Hương ô long nướng đậm đà, vị béo ngọt êm dịu', 45000, NULL, 35, 1, GETDATE(), GETDATE()),
        (N'Caramel Macchiato', N'Espresso thơm nồng quyện cùng sốt caramel béo ngậy', 49000, NULL, 25, 1, GETDATE(), GETDATE()),
        (N'Trà sen vàng hạt sen', N'Trà sen thanh khiết điểm xuyết hạt sen bùi bùi giòn ngọt', 45000, NULL, 30, 1, GETDATE(), GETDATE()),
        (N'Cacao dừa đá xay', N'Cacao nguyên chất béo thơm vị sữa dừa tươi mát', 42000, NULL, 30, 1, GETDATE(), GETDATE());
      END
    `;
    await executeSql(connection, seedSql);
    const countResult = await executeSql(connection, 'SELECT COUNT(*) AS total FROM [dbo].[Product]');
    console.log(`[seed] Total products in database: ${countResult.rows[0]?.total}`);
  } finally {
    connection.close();
  }
}

main().catch((err) => {
  console.error('[seed] Seed error:', err);
  process.exit(1);
});
