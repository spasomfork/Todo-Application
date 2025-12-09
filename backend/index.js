const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./db");
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(bodyParser.json());
// Get latest 5 incomplete tasks
app.get("/tasks", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM task WHERE status = false ORDER BY created_at DESC LIMIT 5"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
// Create a new task (WITH VALIDATION)
app.post("/tasks", async (req, res) => {
  try {
    const { title, description } = req.body;
    
    // Validation: Return 400 if title or description is missing/empty
    if (!title || !title.trim() || !description || !description.trim()) {
      return res.status(400).send("Title and description are required");
    }
    await db.query(
      "INSERT INTO task (title, description, status, created_at) VALUES (?, ?, false, NOW())",
      [title, description]
    );
    res.status(201).send({ title, description }); // Return the created object for test verification
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
// Mark task as done
app.put("/tasks/:id/done", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if task exists first (Optional, but good for 404 test)
    const [check] = await db.query("SELECT * FROM task WHERE id = ?", [id]);
    if (check.length === 0) {
      return res.status(404).send("Task not found");
    }
    await db.query("UPDATE task SET status = true WHERE id = ?", [id]);
    res.send("Task marked done");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
// Only listen if not testing
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
module.exports = app;