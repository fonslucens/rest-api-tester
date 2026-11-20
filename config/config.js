import fs from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

// Load the .env file from the project root (values already set in the shell win).
const envPath = fileURLToPath(new URL('../.env', import.meta.url));
if (fs.existsSync(envPath)) loadEnvFile(envPath);

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || '127.0.0.1',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/Portfolio',
  jwtSecret: process.env.JWT_SECRET,
  allowBulkDelete: process.env.ALLOW_BULK_DELETE === 'true'
};

export default config;
