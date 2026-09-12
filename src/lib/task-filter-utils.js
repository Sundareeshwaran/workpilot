/**
 * Utility functions for Task filtering, date calculations, and overdue state checks.
 * These functions are pure and never mutate input task objects.
 */

export function calculateDaysRemaining(dueDate) {
  if (!dueDate) return null;
  const target = new Date(dueDate);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  const diffTime = target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isTaskOverdue(task) {
  if (!task?.dueDate) return false;
  if (task.status === "DONE") return false;
  const target = new Date(task.dueDate);
  if (isNaN(target.getTime())) return false;
  const now = new Date();
  return target.setHours(0, 0, 0, 0) < now.setHours(0, 0, 0, 0);
}

export function isTaskDueSoon(task, daysThreshold = 3) {
  if (!task?.dueDate) return false;
  if (task.status === "DONE") return false;
  const days = calculateDaysRemaining(task.dueDate);
  return days !== null && days >= 0 && days <= daysThreshold;
}

export function filterTasks(
  tasks = [],
  {
    searchQuery = "",
    statusFilter = "ALL",
    priorityFilter = "ALL",
    dueDateFilter = "ALL",
    projectFilter = "ALL",
  } = {},
) {
  if (!Array.isArray(tasks)) return [];

  const query = (searchQuery || "").trim().toLowerCase();

  return tasks.filter((task) => {
    // 1. Search Query (Title and Description)
    if (query) {
      const matchTitle = task.title?.toLowerCase().includes(query);
      const matchDesc = task.description?.toLowerCase().includes(query);
      if (!matchTitle && !matchDesc) {
        return false;
      }
    }

    // 2. Status Filter
    if (statusFilter && statusFilter !== "ALL" && task.status !== statusFilter) {
      return false;
    }

    // 3. Priority Filter
    if (
      priorityFilter &&
      priorityFilter !== "ALL" &&
      task.priority !== priorityFilter
    ) {
      return false;
    }

    // 4. Project Filter
    if (
      projectFilter &&
      projectFilter !== "ALL" &&
      task.projectId !== projectFilter
    ) {
      return false;
    }

    // 5. Due Date State Filter
    if (dueDateFilter === "OVERDUE") {
      if (!isTaskOverdue(task)) return false;
    } else if (dueDateFilter === "DUE_SOON") {
      if (!isTaskDueSoon(task)) return false;
    } else if (dueDateFilter === "NO_DUE_DATE") {
      if (task.dueDate) return false;
    }

    return true;
  });
}
