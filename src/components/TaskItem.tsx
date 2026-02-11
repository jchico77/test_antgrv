import React from 'react';
import type { Task } from '../types';
import { useTaskStore } from '../store/useTaskStore';
import { cn } from '../lib/utils';
import { Check, Trash2, GripVertical, Clock, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface TaskItemProps {
    task: Task;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
    const { toggleTask, deleteTask, selectTask, selectedTaskId } = useTaskStore();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => {
                // Prevent selection if clicking controls
                if ((e.target as HTMLElement).closest('button, select, a')) return;
                selectTask(task.id);
            }}
            className={cn(
                "group relative flex items-center p-2 rounded-sm border transition-all duration-75 mb-1 cursor-pointer",
                task.isCompleted
                    ? "border-border bg-surface/50 text-text-muted"
                    : "bg-surface hover:border-primary-500/50",
                selectedTaskId === task.id ? "border-primary-500 ring-1 ring-primary-500/20 bg-primary-500/5" : "border-border"
            )}
        >
            {/* Draggable Indicator (Visual only, drag handled by parent) */}
            <div className="cursor-grab text-text-muted hover:text-text-primary mr-2 opacity-50 group-hover:opacity-100 transition-opacity">
                <GripVertical size={14} />
            </div>

            {/* Checkbox / Status Indicator - Technical Style */}
            <button
                onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                className={cn(
                    "flex-shrink-0 w-4 h-4 rounded-sm border mr-3 flex items-center justify-center transition-all",
                    task.isCompleted
                        ? "bg-primary-900 border-primary-500 text-primary-400"
                        : "border-text-secondary hover:border-primary-400 bg-transparent"
                )}
            >
                {task.isCompleted && <Check size={10} strokeWidth={4} />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0 text-sm">
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "truncate transition-all select-none",
                        task.isCompleted ? "line-through opacity-50" : "text-text-primary"
                    )}>
                        {task.title}
                    </span>

                    {/* Icons Row */}
                    <div className="flex items-center gap-1.5 opacity-70">
                        {task.content && (
                            <FileText size={10} className="text-text-secondary" />
                        )}
                        {task.dueDate && (
                            <span className="text-[10px] text-text-muted flex items-center">
                                <Clock size={10} className="mr-0.5" />
                                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        useTaskStore.getState().setCurrentView('plan');
                    }}
                    className="mr-2 text-[10px] font-bold text-text-muted hover:text-primary-400 uppercase tracking-wider"
                    title="Time Block this task"
                >
                    PLAN
                </button>

                <div className="relative group/select">
                    <select
                        className="bg-transparent text-[10px] text-text-muted hover:text-primary-400 focus:outline-none cursor-pointer appearance-none border border-transparent rounded p-0.5 font-sans uppercase pr-4"
                        value={task.projectId}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                            const { moveTask } = useTaskStore.getState();
                            moveTask(task.id, e.target.value);
                        }}
                        title="Move to Project"
                    >
                        <option value="inbox" className="bg-surface text-text-primary">INBOX</option>
                        {useTaskStore.getState().projects.filter(p => p.id !== 'inbox').map(p => (
                            <option key={p.id} value={p.id} className="bg-surface text-text-primary">{p.name}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                    className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </motion.div>
    );
};
