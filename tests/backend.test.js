/* =============================================================================
   BACKEND TESTS (Node Environment)
   ========================================================================== */

const request = require("supertest");
// Adjusted path for container environment (mounted in /app/tests)
const app = require("../index");
const db = require("../db");

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
                "INSERT INTO task (title, description, status, created_at) VALUES (?, ?, false, DATE_ADD(NOW(), INTERVAL ? SECOND))",
                [`T${i}`, "X", i]
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
