import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

const client = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,

}
);

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    tech_stacks VARCHAR(255),
    role VARCHAR(255) NOT NULL,
    experience INTEGER
  );
`;

(async () => {
  try {
    await client.connect();
    await client.query(createTableQuery);
    console.log("Users table created or already exists.");
  } catch (err) {
    console.error("Error creating users table:", err);
  }
})();

export default client;