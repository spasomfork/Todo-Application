/**
 * full-app.test.js
 * COMPLETE BACKEND + FRONTEND TEST SUITE (ALL 20 TESTS)
 * Run backend tests:  npx jest _tests_/full-app.test.js
 * Run frontend tests: npx jest _tests_/full-app.test.js --env=jsdom
 */

/* =============================================================================
   BACKEND TESTS (Node Environment)
   ========================================================================== */

const request = require("supertest");
const app = require("../backend/index");
const db = require("../backend/db");

describe("🟦 BACKEND API TESTS", () => {
  beforeEach(async () => {
    await db.query("DELETE FROM task");
  });

  afterAll(async () => {
    await db.end();
  });

  /* -----------------------------------------
     1. POST /tasks – success
  ------------------------------------------ */
  test("POST /tasks → creates task (201)", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: "Sample", description: "Desc" });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Sample");
  });

  /* -----------------------------------------
     2. POST /tasks – validation: empty title
  ------------------------------------------ */
  test("POST /tasks → empty title returns 400", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: "", description: "D" });

    expect(res.statusCode).toBe(400);
  });

  /* -----------------------------------------
     3. POST /tasks – empty description
  ------------------------------------------ */
  test("POST /tasks → empty description returns 400", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: "A", description: "" });

    expect(res.statusCode).toBe(400);
  });

  /* -----------------------------------------
     4. GET /tasks – limit to 5 newest
  ------------------------------------------ */
  test("GET /tasks → returns only 5 newest", async () => {
    for (let i = 1; i <= 8; i++) {
      await db.query(
        "INSERT INTO task (title, description, status, created_at) VALUES (?, ?, false, NOW())",
        [`T${i}`, "X"]
      );
    }

    const res = await request(app).get("/tasks");

    expect(res.body.length).toBe(5);
    expect(res.body[0].title).toBe("T8");
  });

  /* -----------------------------------------
     5. GET /tasks – exclude completed
  ------------------------------------------ */
  test("GET /tasks → excludes completed tasks", async () => {
    await db.query(
      "INSERT INTO task (title, description, status, created_at) VALUES (?, ?, false, NOW())",
      ["Active", "D"]
    );
    await db.query(
      "INSERT INTO task (title, description, status, created_at) VALUES (?, ?, true, NOW())",
      ["Completed", "D"]
    );

    const res = await request(app).get("/tasks");
    const titles = res.body.map((t) => t.title);

    expect(titles).toContain("Active");
    expect(titles).not.toContain("Completed");
  });

  /* -----------------------------------------
     6. PATCH /tasks/:id/complete – success
  ------------------------------------------ */
  test("PATCH /tasks/:id/done → marks task complete", async () => {
    await db.query(
      "INSERT INTO task (title, description, status, created_at) VALUES (?, ?, false, NOW())",
      ["FinishMe", "X"]
    );

    const [rows] = await db.query(
      "SELECT id FROM task WHERE title = 'FinishMe'"
    );
    const id = rows[0].id;

    const res = await request(app).put(`/tasks/${id}/done`);
    expect(res.statusCode).toBe(200);

    const [check] = await db.query("SELECT status FROM task WHERE id=?", [id]);
    expect(Number(check[0].status)).toBe(1);
  });

  /* -----------------------------------------
     7. PATCH /tasks/:id/complete – invalid ID
  ------------------------------------------ */
  test("PATCH /tasks/999999/done → returns 404", async () => {
    const res = await request(app).put(`/tasks/999999/done`);
    expect(res.statusCode).toBe(404);
  });

  /* -----------------------------------------
     8. DB Model – insert works
  ------------------------------------------ */
  test("DB INSERT → correctly inserts task", async () => {
    await db.query(
      "INSERT INTO task (title, description, status, created_at) VALUES (?, ?, false, NOW())",
      ["ModelInsert", "X"]
    );
    const [rows] = await db.query(
      "SELECT * FROM task WHERE title='ModelInsert'"
    );

    expect(rows.length).toBe(1);
    expect(rows[0].title).toBe("ModelInsert");
  });

  /* -----------------------------------------
     9. DB Model – fetch only non-completed
  ------------------------------------------ */
  test("DB SELECT → returns only non-completed tasks", async () => {
    await db.query(
      "INSERT INTO task (title, description, status, created_at) VALUES (?, ?, false, NOW())",
      ["Active", "D"]
    );
    await db.query(
      "INSERT INTO task (title, description, status, created_at) VALUES (?, ?, true, NOW())",
      ["Done", "D"]
    );

    const [rows] = await db.query(
      "SELECT title FROM task WHERE status = false"
    );

    expect(rows.map((r) => r.title)).toEqual(["Active"]);
  });

  /* -----------------------------------------
     10. Error-handling
  ------------------------------------------ */
  test("GET /tasks → handles DB failure", async () => {
    // temporarily break query function
    const orig = db.query;
    db.query = () => {
      throw new Error("DB FAILED");
    };

    const res = await request(app).get("/tasks");
    expect(res.statusCode).toBe(500);

    // restore
    db.query = orig;
  });
});

/* =============================================================================
   FRONTEND TESTS (jsdom environment)
   ========================================================================== */

describe("🟩 FRONTEND UNIT TESTS", () => {
  /**
   * We enable jsdom only in this block.
   */
  beforeAll(() => {
    jest.resetModules();
    jest.setTimeout(20000);
  });

  /**
   * Import React Testing Library stuff inside this block
   */
  const { render, screen, fireEvent, waitFor } = require("@testing-library/react");
  const axios = require("axios");
  jest.mock("axios");

  const App = require("../frontend/src/App").default;
  const TaskModal = require("../frontend/src/components/TaskModal").default;

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: [] });
    axios.post.mockResolvedValue({ data: {} });
    axios.put.mockResolvedValue({ data: {} });
  });

  /* -----------------------------------------
     1. Render task creation form
  ------------------------------------------ */
  test("renders creation form", () => {
    render(<TaskModal onAdd={jest.fn()} />);
    expect(screen.getByPlaceholderText(/Project Proposal/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add/i })).toBeInTheDocument();
  });

  /* -----------------------------------------
     2. Validation – empty title
  ------------------------------------------ */
  test("empty title blocks submission", () => {
    const onAdd = jest.fn();
    render(<TaskModal onAdd={onAdd} />);
    fireEvent.click(screen.getByRole("button", { name: /Add/i }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  /* -----------------------------------------
     3. Validation – empty description
  ------------------------------------------ */
  test("empty description blocks submission", () => {
    const onAdd = jest.fn();
    render(<TaskModal onAdd={onAdd} />);

    fireEvent.change(screen.getByPlaceholderText(/Project Proposal/i), {
      target: { value: "Hello" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Add/i }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  /* -----------------------------------------
     4. POST submission
  ------------------------------------------ */
  test("successful submission triggers API call", async () => {
    render(<App />);

    fireEvent.change(
      screen.getByPlaceholderText(/Project Proposal/i),
      { target: { value: "New UX" } }
    );
    fireEvent.change(
      screen.getByPlaceholderText(/Write the first draft/i),
      { target: { value: "Specs" } }
    );

    fireEvent.click(screen.getByRole("button", { name: /Add/i }));

    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/tasks"),
        expect.objectContaining({ title: "New UX", description: "Specs" })
      )
    );
  });

  /* -----------------------------------------
     5. UI shows only 5 tasks (rendering)
  ------------------------------------------ */
  test("shows only the 5 tasks given by API", async () => {
    const mock = Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      title: `Task ${i}`,
      description: "D",
    }));

    axios.get.mockResolvedValueOnce({ data: mock });

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText(/Task/).length).toBe(5);
    });
  });

  /* -----------------------------------------
     6. Clicking “Done” calls API
  ------------------------------------------ */
  test("'Done' triggers axios.put", async () => {
    const mock = [{ id: 11, title: "Finish Task", description: "Do" }];
    axios.get.mockResolvedValueOnce({ data: mock });

    render(<App />);

    await waitFor(() =>
      expect(screen.getByText("Finish Task")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("Done"));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining("/tasks/11/done")
      );
    });
  });

  /* -----------------------------------------
     7. Completed task removed from UI
  ------------------------------------------ */
  test("completed task disappears from UI", async () => {
    const task = { id: 22, title: "RemoveMe", description: "D" };

    axios.get.mockResolvedValueOnce({ data: [task] }); // first load
    axios.put.mockResolvedValueOnce({});               // completion
    axios.get.mockResolvedValueOnce({ data: [] });     // refreshed list

    render(<App />);

    await waitFor(() =>
      expect(screen.getByText("RemoveMe")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("Done"));

    await waitFor(() =>
      expect(screen.queryByText("RemoveMe")).not.toBeInTheDocument()
    );
  });

  /* -----------------------------------------
     8. Tasks render correctly
  ------------------------------------------ */
  test("task content matches API", async () => {
    axios.get.mockResolvedValueOnce({
      data: [{ id: 1, title: "ABC", description: "XYZ" }],
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("ABC")).toBeInTheDocument();
      expect(screen.getByText("XYZ")).toBeInTheDocument();
    });
  });

  /* -----------------------------------------
     9. Loading state
  ------------------------------------------ */
  test("shows loading state before tasks load", () => {
    axios.get.mockReturnValue(new Promise(() => {})); // never resolves

    render(<App />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  /* -----------------------------------------
     10. Error state
  ------------------------------------------ */
  test("renders error UI when API fails", async () => {
    axios.get.mockRejectedValueOnce(new Error("API FAIL"));

    render(<App />);

    await waitFor(() =>
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    );
  });
});
