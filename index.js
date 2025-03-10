import express from "express";
import client from "./db.js";
import dotenv from "dotenv";
import STATUS_CODES from "./config/statusCodes.js"; // Importing status codes
import QueryStream from "pg-query-stream";

dotenv.config();

const app = express();
app.use(express.json());

app.post("/api/report-service/user", async (req, res) => {
  try {
    // Extract user details from request body
    const { name, email, tech_stacks, role, experience } = req.body;

    // Validate required fields
    if (!name || !email || !role) {
      throw { status: STATUS_CODES.BAD_REQUEST, message: "Name, email, and role are required" };
    }

    // Insert user into the database
    const result = await client.query(
      "INSERT INTO users (name, email, tech_stacks, role, experience) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, email, tech_stacks, role, experience]
    );

    // Send success response
    res.status(STATUS_CODES.CREATED).json({ success: true, user: result.rows[0] });
  } catch (error) {
    // Handle errors properly
    res.status(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: error.message || "Internal Server Error",
    });
  }
});

app.get("/api/report-service/user", async (req, res) => {
  try {
    // Parse limit from query params (default to 20)
    const limit = parseInt(req.query.limit, 10) || 20;
    // Create a streaming query to fetch user data with the given limit
    const query = new QueryStream("SELECT * FROM users LIMIT $1", [limit]);
    const stream = client.query(query);

    // Set response headers
    res.setHeader("Content-Type", "application/json");
    res.write("["); // Start JSON array

    let first = true;
    stream.on("data", (row) => {
      if (!first) res.write(",");
      res.write(JSON.stringify(row));
      first = false;
    });

    stream.on("end", () => {
      res.write("]"); // End JSON array
      res.end();
    });

    stream.on("error", (streamErr) => {
      console.error("Streaming Error:", streamErr.message);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        status: STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: `Error streaming user data: ${streamErr.message}`,
      });
    });
  } catch (err) {
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      status: STATUS_CODES.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch user data",
    });
  }
});

// Define the port for the server
const PORT = process.env.PORT;

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
