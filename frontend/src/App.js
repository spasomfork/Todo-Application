import React, { useState, useEffect } from "react";
import axios from "axios";
import TaskList from "./components/TaskList";
import TaskModal from "./components/TaskModal";
function App() {
  const [tasks, setTasks] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(true); // Added for tests
  const [error, setError] = useState(null);     // Added for tests
  const fetchTasks = async () => {
    try {
      setLoading(true); // Start loading
      setError(null);   // Reset error
      const res = await axios.get("http://localhost:5000/tasks");
      setTasks(res.data);
    } catch (err) {
      console.error(err);
      setError("Error fetching tasks"); // Set error message
    } finally {
      setLoading(false); // Stop loading
    }
  };
  const addTask = async (task) => {
    try {
      await axios.post("http://localhost:5000/tasks", task);
      setRefresh(!refresh);
    } catch (err) {
      console.error(err);
    }
  };
  const markDone = async (id) => {
    try {
      await axios.put(`http://localhost:5000/tasks/${id}/done`);
      setRefresh(!refresh);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchTasks();
  }, [refresh]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff8f2] to-[#f5efe6] p-10 flex justify-center">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* LEFT — Add Task */}
        <TaskModal onAdd={addTask} />
        {/* RIGHT — Recent Tasks */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Recent Tasks</h2>
          
          {/* Status Messages for Tests */}
          {loading && <p>Loading...</p>}
          {error && <p>{error}</p>}
          {!loading && !error && (
            <TaskList tasks={tasks} onDone={markDone} />
          )}
        </div>
      </div>
    </div>
  );
}
export default App;