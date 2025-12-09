import React, { useState } from "react";

export default function TaskModal({ onAdd }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    if (!e.target.checkValidity()) {
      return;
    }

    e.preventDefault();
    onAdd({ title: title.trim(), description: description.trim() });
    setTitle("");
    setDescription("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Add a Task</h1>

      <label className="font-medium text-gray-700">Title</label>
      <input
        type="text"
        placeholder="e.g., Project Proposal"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input-box"
        required
        pattern="^[\\w\\s.,!?'-]{3,50}$"
      />

      <label className="font-medium text-gray-700 mt-3">Description</label>
      <textarea
        placeholder="e.g., Write the first draft for the meeting…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="input-box h-28"
        required
        pattern="^[\\w\\s.,!?'-]{5,200}$"
      />

      {/* CIRCLE HOVER ADD BUTTON */}
      <button
        type="submit"
        className="
          relative flex h-12 w-full items-center justify-center overflow-hidden
          rounded-xl bg-blue-500 text-white font-semibold shadow-md
          transition-all before:absolute before:top-0 before:left-0 before:h-0 before:w-0
          before:bg-blue-600 before:duration-500 before:ease-out
          hover:before:h-full hover:before:w-full
          mt-4
        "
      >
        <span className="relative z-10">Add</span>
      </button>
    </form>
  );
}
