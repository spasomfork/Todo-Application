import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TaskList({ tasks, onDone }) {
  return (
    <div className="space-y-4">
      <AnimatePresence>
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.2 }}
            className="task-card-ui"
          >
            <div>
              <h3 className="font-semibold text-lg text-gray-800">{task.title}</h3>
              <p className="text-gray-600">{task.description}</p>
            </div>

            <button
              onClick={() => onDone(task.id)}
              className="done-btn"
            >
              Done
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
