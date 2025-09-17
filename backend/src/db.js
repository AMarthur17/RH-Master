import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  connectionString:
    "postgresql://postgres:lvYLkgjijjhSedlGrErSJbuKerOzUFHw@shortline.proxy.rlwy.net:50725/railway", // ou sua URL do Railway
  ssl: {
    rejectUnauthorized: false,
  },
});
