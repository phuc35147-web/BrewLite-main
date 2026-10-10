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
    database: 'master',
    encrypt: true,
    trustServerCertificate: true,
    connectTimeout: 5000,
  },
};

function connectWithRetry(maxRetries = 30, delayMs = 2000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    function tryConnect() {
      attempts++;
      console.log(`[init-db] Attempt ${attempts}/${maxRetries} connecting to ${server}:${port}...`);
      const connection = new Connection(config);

      connection.on('connect', (err) => {
        if (err) {
          console.log(`[init-db] Connection attempt ${attempts} failed: ${err.message}`);
          connection.close();
          if (attempts >= maxRetries) {
            return reject(new Error(`Failed to connect to SQL Server after ${maxRetries} attempts`));
          }
          setTimeout(tryConnect, delayMs);
        } else {
          console.log(`[init-db] Connected to SQL Server master database.`);
          resolve(connection);
        }
      });

      connection.on('error', () => {
        // Handled via connect callback
      });

      connection.connect();
    }

    tryConnect();
  });
}

function executeSql(connection, sql) {
  return new Promise((resolve, reject) => {
    const request = new Request(sql, (err, rowCount) => {
      if (err) return reject(err);
      resolve(rowCount);
    });

    request.on('infoMessage', (info) => {
      if (info.message) console.log(`[init-db SQL info] ${info.message}`);
    });

    connection.execSql(request);
  });
}

async function main() {
  const connection = await connectWithRetry();

  console.log(`[init-db] Ensuring database [${dbName}] exists...`);
  const escapedDb = dbName.replace(/'/g, "''").replace(/]/g, ']]');
  const sql = `
    IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'${escapedDb}')
    BEGIN
      CREATE DATABASE [${escapedDb}];
      PRINT 'Successfully created database ${escapedDb}';
    END
    ELSE
    BEGIN
      PRINT 'Database ${escapedDb} already exists';
    END
  `;

  try {
    await executeSql(connection, sql);
    console.log(`[init-db] Finished database check/creation.`);
  } finally {
    connection.close();
  }
}

main().catch((err) => {
  console.error('[init-db] Fatal error:', err);
  process.exit(1);
});
