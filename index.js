import express from "express";
import client from "./db.js";
import dotenv from "dotenv";
import STATUS_CODES from "./config/statusCodes.js"; // Importing status codes
import QueryStream from "pg-query-stream";
import JSONStream from "JSONStream";


dotenv.config();

const app = express();
app.use(express.json());

/**
 * Custom Error Class for Centralized Error Handling
 */
class Err extends Error {
  constructor(message, status) {
    super(message); 
    this.status = status;
  }
}

app.post("/api/report-service/user", async (req, res) => {
  try {
    // Extracting user details from request body
    const { name, email, tech_stacks, role, experience } = req.body;

    // Validating required fields
    if (!name || !email || !role) {
      throw new Err("Name, email, and role are required", STATUS_CODES.BAD_REQUEST);
    }

    // Inserting the new user into the database
    const result = await client.query(
      "INSERT INTO users (name, email, tech_stacks, role, experience) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, email, tech_stacks, role, experience]
    );

    // Sending a success response with the created user data
    res.status(STATUS_CODES.CREATED).json({ success: true, user: result.rows[0] });
  } catch (error) {
    // Sending an error response with appropriate status code
    res.status(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        status: error.status || STATUS_CODES.INTERNAL_SERVER_ERROR,
        message: error.message || "Internal Server Error",
      });
  }
});

app.get("/api/report-service/user", async (req, res) => {
    try {
      // Create a streaming query to fetch all users
      const query = new QueryStream("SELECT * FROM users");
      const stream = client.query(query);
  
      // Set response headers
      res.setHeader("Content-Type", "application/json");
  
      //  Stream data using JSONStream for proper formatting
      stream.pipe(JSONStream.stringify()).pipe(res);
  
      //  Handle stream errors
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
  

// Defining the port for the server
const PORT = process.env.PORT ;

// Starting the Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
