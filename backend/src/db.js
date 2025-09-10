const { Pool } = require("pg");

const connectionString =
  process.env.DATABASE_URL ||
  `postgres://${process.env.PGUSER || "postgres"}:${
    process.env.PGPASSWORD || ""
  }` +
    `@${process.env.PGHOST || "localhost"}:${process.env.PGPORT || 5432}/${
      process.env.PGDATABASE || "rh_master"
    }`;

const pool = new Pool({ connectionString });

module.exports = {
  query: (text, params) => pool.query(text, params),
};
