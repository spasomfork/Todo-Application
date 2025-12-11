/* =============================================================================
   FRONTEND TESTS (jsdom environment)
   ========================================================================== */

const { render, screen, fireEvent, waitFor } = require("@testing-library/react");
require("@testing-library/jest-dom");

// Mock axios with a factory to avoid importing the ESM module which causes Jest errors in this environment
const mockAxios = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
};
jest.mock("axios", () => mockAxios);
const axios = require("axios"); // This will now return our mock object without reading node_modules

// Adjusted paths for container environment (mounted in /app/src/tests)
const App = require("../App").default;
const TaskModal = require("../components/TaskModal").default;

describe("🟩 FRONTEND UNIT TESTS", () => {
    /**
     * We enable jsdom only in this block.
     */
    beforeAll(() => {
        jest.resetModules();
        jest.setTimeout(20000);
    });

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
        fireEvent.submit(screen.getByRole("button", { name: /Add/i }).closest("form"));
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

        fireEvent.submit(screen.getByRole("button", { name: /Add/i }).closest("form"));
        expect(onAdd).not.toHaveBeenCalled();
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
            expect(screen.getAllByText(/Task \d/).length).toBe(5);
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
        axios.get.mockReturnValue(new Promise(() => { })); // never resolves

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
