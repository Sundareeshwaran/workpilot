"use client";

import { useMemo } from "react";
import KanbanColumn from "./kanban-column";

const COLUMNS = [
  { status: "TODO", title: "To Do" },
  { status: "IN_PROGRESS", title: "In Progress" },
  { status: "DONE", title: "Done" },
];

export default function KanbanBoard({
  tasks = [],
  onAddTask,
  onStatusChange,
  onDelete,
  onDropTask,
}) {
  const tasksByStatus = useMemo(() => {
    const grouped = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
    };

    (tasks || []).forEach((task) => {
      const statusKey = task.status || "TODO";
      if (grouped[statusKey]) {
        grouped[statusKey].push(task);
      } else {
        grouped.TODO.push(task);
      }
    });

    return grouped;
  }, [tasks]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-start">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            title={col.title}
            tasks={tasksByStatus[col.status] || []}
            onAddTask={onAddTask}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onDropTask={onDropTask}
          />
        ))}
      </div>
    </div>
  );
}
