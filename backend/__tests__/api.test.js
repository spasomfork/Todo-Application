/**
 * api.test.js
 * ========================================
 * Combined Backend, Frontend, and Integration Tests
 * All in one file
 */

import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import request from "supertest";
import app from "../index.js"; // Express backend
import db from "../db.js";

import TaskModal from "../components/TaskModal.js";
import TaskList from "../components/TaskList.js";
import App from "../App.js";

jest.mock("axios");

/* ==========================
   Backend Test Helpers
========================== */
beforeEach(async () => {
  await db.query("DELETE FROM task");
});

afterAll(async () => {
  await db.end();
});

/* ==========================
   Backend API Unit Tests
========================== */
describe("Backend API: POST /tasks", () => {
  it("Create a task with valid title & description", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: "Test Task", description: "Test Description" });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Test Task");
  });

  it("Create task with empty title", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: "", description: "Desc" });
    expect(res.statusCode).toBe(400);
  });

  it("Create task with empty description", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: "No Description", description: "" });
    expect(res.statusCode).toBe(201);
    expect(res.body.description).toBe("");
  });

  it("Create task with extremely long title/description", async () => {
    const longTitle = "T".repeat(500);
    const longDesc = "D".repeat(1000);
    const res = await request(app)
      .post("/tasks")
      .send({ title: longTitle, description: longDesc });
    expect(res.statusCode).toBe(201);
    expect(res.body.title.length).toBe(500);
  });
});

describe("Backend API: GET /tasks", () => {
  it("Fetch tasks when tasks exist", async () => {
    for (let i = 1; i <= 6; i++) {
      await db.query(
        "INSERT INTO task (title, description, status) VALUES (?, ?, ?)",
        [`Task ${i}`, "Desc", false]
      );
    }
    const res = await request(app).get("/tasks");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(5);
    expect(res.body[0].title).toBe("Task 6");
  });

  it("Fetch tasks when DB is empty", async () => {
    const res = await request(app).get("/tasks");
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(0);
  });
});

describe("Backend API: PUT /tasks/:id/done", () => {
  it("Mark an existing task as done", async () => {
    const [result] = await db.query(
      "INSERT INTO task (title, description, status) VALUES (?, ?, ?)",
      ["Done Test", "Desc", false]
    );
    const id = result.insertId;
    const res = await request(app).put(`/tasks/${id}/done`);
    expect(res.statusCode).toBe(200);
    const [row] = await db.query("SELECT * FROM task WHERE id=?", [id]);
    expect(row[0].status).toBe(1);
  });

  it("Mark non-existing task as done", async () => {
    const res = await request(app).put("/tasks/999/done");
    expect(res.statusCode).toBe(404);
  });

  it("Mark task already done", async () => {
    const [result] = await db.query(
      "INSERT INTO task (title, description, status) VALUES (?, ?, ?)",
      ["Already Done", "Desc", true]
    );
    const id = result.insertId;
    const res = await request(app).put(`/tasks/${id}/done`);
    expect(res.statusCode).toBe(200);
  });
});

/* ==========================
   Frontend Component Unit Tests
========================== */
describe("Frontend Component: TaskModal", () => {
  it("Input fields update state correctly", () => {
    const mockAdd = jest.fn();
    render(<TaskModal onAdd={mockAdd} />);
    const titleInput = screen.getByPlaceholderText("e.g., Project Proposal");
    const descInput = screen.getByPlaceholderText(
      "e.g., Write the first draft for the meeting…"
    );

    fireEvent.change(titleInput, { target: { value: "New Task" } });
    fireEvent.change(descInput, { target: { value: "Description" } });

    expect(titleInput.value).toBe("New Task");
    expect(descInput.value).toBe("Description");
  });

  it("Clicking Add calls onAdd with correct payload", () => {
    const mockAdd = jest.fn();
    render(<TaskModal onAdd={mockAdd} />);
    fireEvent.change(screen.getByPlaceholderText("e.g., Project Proposal"), {
      target: { value: "Task1" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("e.g., Write the first draft for the meeting…"),
      { target: { value: "Desc" } }
    );
    fireEvent.click(screen.getByText("Add"));
    expect(mockAdd).toHaveBeenCalledWith({ title: "Task1", description: "Desc" });
  });

  it("Clicking Add with empty title does not call onAdd", () => {
    const mockAdd = jest.fn();
    render(<TaskModal onAdd={mockAdd} />);
    fireEvent.click(screen.getByText("Add"));
    expect(mockAdd).not.toHaveBeenCalled();
  });
});

describe("Frontend Component: TaskList", () => {
  it("Renders task list correctly", () => {
    const tasks = [{ id: 1, title: "T1", description: "D1" }];
    render(<TaskList tasks={tasks} onDone={() => {}} />);
    expect(screen.getByText("T1")).toBeInTheDocument();
    expect(screen.getByText("D1")).toBeInTheDocument();
  });

  it("Clicking Done button calls onDone", () => {
    const tasks = [{ id: 1, title: "T1", description: "D1" }];
    const mockDone = jest.fn();
    render(<TaskList tasks={tasks} onDone={mockDone} />);
    fireEvent.click(screen.getByText("Done"));
    expect(mockDone).toHaveBeenCalledWith(1);
  });
});

/* ==========================
   Integration Tests (Frontend + Backend)
========================== */
describe("Integration Tests: Frontend + Backend", () => {
  it("Add a task via UI calls backend and updates UI", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    axios.post.mockResolvedValueOnce({
      data: { id: 1, title: "New Task", description: "Desc" },
    });

    render(<App />);

    fireEvent.change(screen.getByPlaceholderText("e.g., Project Proposal"), {
      target: { value: "New Task" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("e.g., Write the first draft for the meeting…"),
      { target: { value: "Desc" } }
    );
    fireEvent.click(screen.getByText("Add"));

    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith("http://localhost:5000/tasks", {
        title: "New Task",
        description: "Desc",
      })
    );
  });
});
