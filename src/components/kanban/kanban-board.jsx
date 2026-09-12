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
  onTaskUpdated,
  onDelete,
  onTaskDeleted,
  onDropTask,
  updatingTaskIds = new Set(),
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
    <div className="w-full overflow-x-auto pb-2 -mx-1 px-1">
      <div className="flex gap-4 lg:gap-6 items-start min-w-[960px]">
        {COLUMNS.map((col) => (
          <div key={col.status} className="flex-1 min-w-[300px]">
            <KanbanColumn
              status={col.status}
              title={col.title}
              tasks={tasksByStatus[col.status] || []}
              onAddTask={onAddTask}
              onStatusChange={onStatusChange}
              onTaskUpdated={onTaskUpdated}
              onDelete={onDelete}
              onTaskDeleted={onTaskDeleted}
              onDropTask={onDropTask}
              updatingTaskIds={updatingTaskIds}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
