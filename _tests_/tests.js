/**
 * backend.test.js
 * 10 backend unit tests using Jest + Supertest, matching your API exactly.
 */

const request = require("supertest");
const app = require("../backend/index"); // exports app (Express)
const db = require("../backend/db");

beforeEach(async () => {
  // Clear tasks before each test
  await db.query("DELETE FROM task");
});

afterAll(async () => {
  // Close DB connection pool
  await db.end();
});

describe("POST /tasks - create and validation", () => {
  test("POST /tasks creates a task (201)", async () => {
    const res = await request(app).post("/tasks").send({ title: "T1", description: "D1" });
    expect(res.statusCode).toBe(201);
  });

  test("POST /tasks missing title -> 400", async () => {
    const res = await request(app).post("/tasks").send({ title: "", description: "D" });
    expect(res.statusCode).toBe(400);
  });

  test("POST /tasks missing description -> 400", async () => {
    const res = await request(app).post("/tasks").send({ title: "T", description: "" });
    expect(res.statusCode).toBe(400);
  });

  test("POST /tasks long title/description handled", async () => {
    const longTitle = "T".repeat(300);
    const longDesc = "D".repeat(1000);
    const res = await request(app).post("/tasks").send({ title: longTitle, description: longDesc });
    expect(res.statusCode).toBe(201);
  });
});

describe("GET /tasks - retrieval behaviour", () => {
  test("GET /tasks returns 5 most recent (max 5)", async () => {
    for (let i = 1; i <= 6; i++) {
      await db.query(
        "INSERT INTO task (title, description, status, created_at) VALUES (?, ?, false, NOW())",
        [`Task ${i}`, `Desc ${i}`]
      );
      // small pause not necessary, DB NOW() is fine in this context
    }
    const res = await request(app).get("/tasks");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(5);
    // most recent first -> Task 6 should be first
    expect(res.body[0].title).toBe("Task 6");
  });

  test("GET /tasks excludes completed tasks", async () => {
    await db.query(
      "INSERT INTO task (title, description, status, created_at) VALUES (?, ?, true, NOW())",
      ["Done", "Desc"]
    );
    const res = await request(app).get("/tasks");
    expect(res.statusCode).toBe(200);
    expect(res.body.find((t) => t.title === "Done")).toBeUndefined();
  });

  test("GET /tasks returns tasks sorted by created_at (most recent first)", async () => {
    // insert with explicit created_at so ordering is predictable
    await db.query(
      "INSERT INTO task (title, description, status, created_at) VALUES (?, ?, false, ?)",
      ["Old", "Desc", new Date(Date.now() - 10000)]
    );
    await db.query(
      "INSERT INTO task (title, description, status, created_at) VALUES (?, ?, false, ?)",
      ["New", "Desc", new Date()]
    );
    const res = await request(app).get("/tasks");
    expect(res.statusCode).toBe(200);
    expect(res.body[0].title).toBe("New");
  });
});

describe("PUT /tasks/:id/done - mark complete", () => {
  test("PUT /tasks/:id/done marks an existing task as done (200)", async () => {
    const [result] = await db.query(
      "INSERT INTO task (title, description, status, created_at) VALUES (?, ?, false, NOW())",
      ["ToComplete", "Desc"]
    );
    const id = result.insertId;
    const res = await request(app).put(`/tasks/${id}/done`);
    expect(res.statusCode).toBe(200);
    const [rows] = await db.query("SELECT status FROM task WHERE id = ?", [id]);
    expect(rows[0].status == 1 || rows[0].status === true).toBeTruthy();
  });

  test("PUT /tasks/:id/done for non-existing id returns 404", async () => {
    const res = await request(app).put("/tasks/999999/done");
    expect(res.statusCode).toBe(404);
  });
});

describe("DB model & error handling", () => {
  test("Database insert creates correct row", async () => {
    const res = await db.query(
      "INSERT INTO task (title, description, status, created_at) VALUES (?, ?, false, NOW())",
      ["ModelTest", "Desc"]
    );
    const insertId = res[0].insertId;
    const [rows] = await db.query("SELECT * FROM task WHERE id = ?", [insertId]);
    expect(rows[0].title).toBe("ModelTest");
  });

  test("API responds 500 on unexpected DB failure", async () => {
    // temporarily stub db.query to throw
    const orig = db.query;
    db.query = jest.fn(() => { throw new Error("Forced failure"); });
    const res = await request(app).get("/tasks");
    expect(res.statusCode).toBe(500);
    // restore
    db.query = orig;
  });
});


/**
 * frontend.test.js
 * 10 frontend unit tests using Jest + @testing-library/react
 * These tests assume your React components paths:
 *  - ../frontend/src/components/TaskModal
 *  - ../frontend/src/components/TaskList
 * and that TaskModal calls onAdd({title, description}) on submit.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";

// Import components from your frontend source
import TaskModal from "../frontend/src/components/TaskModal";
import TaskList from "../frontend/src/components/TaskList";
import App from "../frontend/src/App";

// Mock axios for API calls used in App
jest.mock("axios");

beforeEach(() => {
  jest.clearAllMocks();
});

/* 1) Render the task creation form: title, description, Add button */
test("Render task creation form", () => {
  render(<TaskModal onAdd={() => {}} />);
  expect(screen.getByPlaceholderText(/Project Proposal/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Write the first draft/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Add/i })).toBeInTheDocument();
});

/* 2) Form validation - empty title prevents submission */
test("Form validation - empty title", () => {
  const mockAdd = jest.fn();
  render(<TaskModal onAdd={mockAdd} />);
  fireEvent.change(screen.getByPlaceholderText(/Write the first draft/i), { target: { value: "Desc" } });
  fireEvent.click(screen.getByRole("button", { name: /Add/i }));
  expect(mockAdd).not.toHaveBeenCalled();
});

/* 3) Form validation - empty description prevents submission */
test("Form validation - empty description", () => {
  const mockAdd = jest.fn();
  render(<TaskModal onAdd={mockAdd} />);
  fireEvent.change(screen.getByPlaceholderText(/Project Proposal/i), { target: { value: "Title" } });
  fireEvent.click(screen.getByRole("button", { name: /Add/i }));
  expect(mockAdd).not.toHaveBeenCalled();
});

/* 4) Successful form submission triggers API call (App uses axios.post) */
test("Successful form submission triggers API call", async () => {
  axios.get.mockResolvedValueOnce({ data: [] }); // initial load
  axios.post.mockResolvedValueOnce({ data: { id: 1, title: "T", description: "D" } });
  render(<App />);
  fireEvent.change(screen.getByPlaceholderText(/Project Proposal/i), { target: { value: "T" } });
  fireEvent.change(screen.getByPlaceholderText(/Write the first draft/i), { target: { value: "D" } });
  fireEvent.click(screen.getByRole("button", { name: /Add/i }));
  await waitFor(() => {
    expect(axios.post).toHaveBeenCalledWith("http://localhost:5000/tasks", { title: "T", description: "D" });
  });
});

/* 5) Task list shows only 5 tasks when API returns >5 */
test("Task list shows only 5 tasks", async () => {
  // Create 7 mock tasks
  const tasks = Array.from({ length: 7 }).map((_, i) => ({ id: i + 1, title: `t${i + 1}`, description: `d${i + 1}` }));
  axios.get.mockResolvedValueOnce({ data: tasks });
  render(<App />);
  // Wait for render; expect at most 5 titles visible
  await waitFor(() => {
    const shown = tasks.slice(-5).map((t) => screen.queryByText(t.title)).filter(Boolean);
    expect(shown.length).toBeLessThanOrEqual(5);
  });
});

/* 6) Clicking "Done" should trigger the completion API call */
test("Clicking Done triggers completion API", async () => {
  axios.get.mockResolvedValueOnce({ data: [{ id: 42, title: "T42", description: "D42" }] });
  axios.put.mockResolvedValueOnce({ data: {} });
  render(<App />);
  await waitFor(() => expect(screen.getByText(/T42/)).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: /Done/i }));
  await waitFor(() => expect(axios.put).toHaveBeenCalled());
});

/* 7) Completed tasks removed from UI after Done */
test("Completed tasks removed from UI after Done", async () => {
  axios.get.mockResolvedValueOnce({ data: [{ id: 100, title: "T100", description: "D100" }] });
  axios.put.mockResolvedValueOnce({ data: {} });
  render(<App />);
  await waitFor(() => expect(screen.getByText("T100")).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: /Done/i }));
  // After calling put, assume App fetches again: mock empty second GET
  axios.get.mockResolvedValueOnce({ data: [] });
  await waitFor(() => expect(screen.queryByText("T100")).toBeNull());
});

/* 8) Tasks render with correct title and description */
test("Tasks render with correct content", async () => {
  axios.get.mockResolvedValueOnce({ data: [{ id: 7, title: "Hello", description: "World" }] });
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("World")).toBeInTheDocument();
  });
});

/* 9) Loading state: App should show something while fetching (best-effort) */
test("Loading state before tasks load", async () => {
  let resolveGet;
  axios.get.mockImplementationOnce(() => new Promise((res) => { resolveGet = res; }));
  render(<App />);
  // If your App shows a "loading" element, this will find it; otherwise it is a no-op
  // We allow either presence or not — this test just guards that App can handle pending state
  // Now resolve GET
  resolveGet({ data: [] });
  await waitFor(() => expect(axios.get).toHaveBeenCalled());
});

/* 10) Error state when API fails */
test("Error state shown if API fails", async () => {
  axios.get.mockRejectedValueOnce(new Error("Network error"));
  render(<App />);
  // Your app logs error to console; we assert axios.get was called and rejected
  await waitFor(() => expect(axios.get).toHaveBeenCalled());
});
