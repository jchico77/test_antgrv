import React from 'react';
import type { Task } from '../types';
import { TaskItem } from './TaskItem';
import { Reorder, AnimatePresence } from 'framer-motion';

interface TaskListProps {
    tasks: Task[];
    onReorder?: (tasks: Task[]) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, onReorder }) => {
    // We need a local state or just use the tasks prop if the parent handles update
    // For simplicity, we assume parent handles updates via onReorder, but useTaskStore doesn't strictly support reordering yet.
    // We'll just render the list for now, and implement strict reordering in store later if needed.
    // Actually, Reorder.Group needs an onReorder prop that updates the order.

    // For this MVP, we might skip actual persisted reordering and just let it be visual or local,
    // but Reorder.Group requires it.
    // Let's just use a simple list map for now if we don't strictly need drag-to-reorder persistence yet,
    // OR we implement a dummy onReorder.

    const handleReorder = (newOrder: Task[]) => {
        // TODO: Update store with new order
        if (onReorder) onReorder(newOrder);
    };

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                <div className="mb-4 text-6xl">🎉</div>
                <p className="text-lg">All caught up! Time to relax.</p>
            </div>
        )
    }

    return (
        <Reorder.Group axis="y" values={tasks} onReorder={handleReorder} className="space-y-1">
            <AnimatePresence>
                {tasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                ))}
            </AnimatePresence>
        </Reorder.Group>
    );
};
