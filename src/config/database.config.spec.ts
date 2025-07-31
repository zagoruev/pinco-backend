import databaseConfig from './database.config';

describe('Database Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return database configuration with environment values', () => {
    process.env.DB_HOST = 'production-db.example.com';
    process.env.DB_PORT = '3307';
    process.env.DB_USERNAME = 'prod_user';
    process.env.DB_PASSWORD = 'prod_password';
    process.env.DB_DATABASE = 'pinco_prod';

    const config = databaseConfig();

    expect(config).toEqual({
      host: 'production-db.example.com',
      port: 3307,
      username: 'prod_user',
      password: 'prod_password',
      database: 'pinco_prod',
    });
  });

  it('should return default values when environment variables are not set', () => {
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USERNAME;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_DATABASE;

    const config = databaseConfig();

    expect(config).toEqual({
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'pinco',
    });
  });

  it('should handle empty string environment variables and use defaults', () => {
    process.env.DB_HOST = '';
    process.env.DB_PORT = '';
    process.env.DB_USERNAME = '';
    process.env.DB_PASSWORD = '';
    process.env.DB_DATABASE = '';

    const config = databaseConfig();

    expect(config).toEqual({
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'pinco',
    });
  });

  it('should parse port as integer', () => {
    process.env.DB_PORT = '5432';

    const config = databaseConfig();

    expect(config.port).toBe(5432);
    expect(typeof config.port).toBe('number');
  });

  it('should handle partial configuration', () => {
    process.env.DB_HOST = 'custom-host.com';
    process.env.DB_DATABASE = 'custom_db';
    // Leave other values to use defaults
    delete process.env.DB_PORT;
    delete process.env.DB_USERNAME;
    delete process.env.DB_PASSWORD;

    const config = databaseConfig();

    expect(config).toEqual({
      host: 'custom-host.com',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'custom_db',
    });
  });
});
