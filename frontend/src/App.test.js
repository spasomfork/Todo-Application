
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import App from './App';
import TaskModal from './components/TaskModal';

// Mock axios
jest.mock('axios');

describe("🟩 FRONTEND UNIT TESTS", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        axios.get.mockResolvedValue({ data: [] });
        // Default success responses for post/put
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
        // Return a promise that never resolves to simulate loading
        axios.get.mockReturnValue(new Promise(() => { }));

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
