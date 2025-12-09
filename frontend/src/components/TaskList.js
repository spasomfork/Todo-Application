import React from "react";
export default function TaskList({ tasks, onDone }) {
  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div
          key={task.id}
          data-cy="task-item" 
          className="
            bg-white p-5 rounded-2xl shadow-md flex justify-between items-center
            transition-transform duration-300
            hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-300
          "
        >
          <div>
            <h3 className="font-semibold text-lg text-gray-800">{task.title}</h3>
            <p className="text-gray-600">{task.description}</p>
          </div>
          {/* SWIPE DONE BUTTON */}
          <button
            onClick={() => onDone(task.id)}
            className="
              relative h-10 w-28 overflow-hidden rounded-full
              border border-yellow-500 bg-white px-3 text-yellow-600 font-medium
              shadow-md transition-all
              before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0
              before:h-full before:w-0 before:bg-yellow-500 before:transition-all
              before:duration-500 hover:text-white hover:shadow-yellow-400
              hover:before:left-0 hover:before:w-full
            "
          >
            <span className="relative z-10">Done</span>
          </button>
        </div>
      ))}
    </div>
  );
}