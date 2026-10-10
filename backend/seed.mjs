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
    console.log(`[seed] Checking product count in database [${dbName}]...`);
    const checkResult = await executeSql(connection, 'SELECT COUNT(*) AS total FROM [dbo].[Product]');
    const total = checkResult.rows[0]?.total ?? 0;

    if (total === 0) {
      console.log('[seed] Seeding 4 default products into [dbo].[Product]...');
      const seedSql = `
        INSERT INTO [dbo].[Product]
        ([name], [description], [price], [imageUrl], [stock], [isActive], [createdAt], [updatedAt])
        VALUES
        (N'Cà phê sữa', N'Cà phê sữa truyền thống', 35000, N'/images/ca-phe-sua.jpg', 50, 1, GETDATE(), GETDATE()),
        (N'Americano', N'Americano đậm vị', 40000, N'/images/americano.jpg', 50, 1, GETDATE(), GETDATE()),
        (N'Cappuccino', N'Cappuccino thơm béo', 45000, N'/images/cappuccino.jpg', 30, 1, GETDATE(), GETDATE()),
        (N'Trà đào', N'Trà đào thanh mát', 39000, N'/images/tra-dao.jpg', 40, 1, GETDATE(), GETDATE());
      `;
      await executeSql(connection, seedSql);
      console.log('[seed] Seeded 4 default products successfully.');
    } else {
      console.log(`[seed] [dbo].[Product] already contains ${total} product(s). Skipping seed.`);
    }
  } finally {
    connection.close();
  }
}

main().catch((err) => {
  console.error('[seed] Seed error:', err);
  process.exit(1);
});
