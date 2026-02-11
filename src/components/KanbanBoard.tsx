import React, { useState } from 'react';
import type { Task, Project } from '../types';
import { useTaskStore } from '../store/useTaskStore';
import { TaskItem } from './TaskItem';
import { cn } from '../lib/utils';
import { Plus, Trash2 } from 'lucide-react';

interface KanbanBoardProps {
    project: Project;
    tasks: Task[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ project, tasks }) => {
    const { updateTaskStatus, addColumn, updateColumn, deleteColumn } = useTaskStore();
    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState('');
    const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    const columns = project.columns || [
        { id: 'todo', title: 'TO DO', order: 0 },
        { id: 'in-progress', title: 'IN PROGRESS', order: 1 },
        { id: 'done', title: 'DONE', order: 2 },
    ];

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const onDrop = (e: React.DragEvent, status: string) => {
        const taskId = e.dataTransfer.getData("taskId");
        if (taskId) {
            updateTaskStatus(taskId, status);
        }
    };

    const onDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
    };

    const handleAddColumn = (e: React.FormEvent) => {
        e.preventDefault();
        if (newColumnTitle.trim()) {
            addColumn(project.id, newColumnTitle);
            setNewColumnTitle('');
            setIsAddingColumn(false);
        }
    };

    const handleUpdateColumn = (columnId: string) => {
        if (editTitle.trim()) {
            updateColumn(project.id, columnId, editTitle);
            setEditingColumnId(null);
        }
    };

    const startEditing = (col: { id: string, title: string }) => {
        setEditingColumnId(col.id);
        setEditTitle(col.title);
    };

    return (
        <div className="flex h-full gap-4 overflow-x-auto pb-4 items-start">
            {columns.map((col) => {
                const colTasks = tasks.filter(t => t.status === col.id || (!t.status && col.id === 'todo')); // Fallback for legacy

                return (
                    <div
                        key={col.id}
                        className="flex-shrink-0 w-80 bg-surface/50 border border-border rounded-lg flex flex-col max-h-full group"
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, col.id)}
                    >
                        {/* Header */}
                        <div className="p-3 border-b border-border flex items-center justify-between bg-surface z-10 rounded-t-lg">
                            {editingColumnId === col.id ? (
                                <div className="flex items-center gap-1 w-full">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="flex-1 bg-background border border-primary-500 rounded text-xs px-2 py-1 text-text-primary focus:outline-none"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleUpdateColumn(col.id);
                                            if (e.key === 'Escape') setEditingColumnId(null);
                                        }}
                                        onBlur={() => handleUpdateColumn(col.id)}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 flex-1 min-w-0 group/header cursor-pointer" onClick={() => startEditing(col)}>
                                    <div className={cn("w-2 h-2 rounded-full",
                                        col.id === 'done' ? "bg-primary-500" :
                                            col.id === 'in-progress' ? "bg-yellow-500" : "bg-text-muted"
                                    )} />
                                    <h3 className="text-xs font-bold text-text-secondary tracking-wider uppercase truncate">
                                        {col.title}
                                    </h3>
                                    <span className="text-text-muted text-xs ml-1">({colTasks.length})</span>
                                </div>
                            )}

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => deleteColumn(project.id, col.id)}
                                    className="p-1 hover:bg-red-900/20 text-text-muted hover:text-red-400 rounded"
                                    title="Delete Column"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>

                        {/* Tasks */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar min-h-[100px]">
                            {colTasks.length === 0 && (
                                <div className="h-24 flex items-center justify-center text-text-secondary text-xs opacity-70 border-2 border-dashed border-border/50 rounded m-2 font-medium">
                                    Drop Task Here
                                </div>
                            )}
                            {colTasks.map(task => (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, task.id)}
                                    className="cursor-move"
                                >
                                    <TaskItem task={task} />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Add Column Button */}
            {isAddingColumn ? (
                <form onSubmit={handleAddColumn} className="flex-shrink-0 w-80 p-3 bg-surface border border-border rounded-lg">
                    <input
                        autoFocus
                        type="text"
                        placeholder="Column Title..."
                        className="w-full bg-background border border-primary-500 rounded text-sm px-3 py-2 text-text-primary mb-2 focus:outline-none"
                        value={newColumnTitle}
                        onChange={e => setNewColumnTitle(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-primary-600 text-white text-xs font-bold py-1.5 rounded hover:bg-primary-700">Add</button>
                        <button type="button" onClick={() => setIsAddingColumn(false)} className="flex-1 bg-transparent border border-border text-text-muted text-xs font-bold py-1.5 rounded hover:text-text-primary">Cancel</button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setIsAddingColumn(true)}
                    className="flex-shrink-0 w-80 h-12 flex items-center justify-center gap-2 border border-dashed border-border rounded-lg text-text-muted hover:text-primary-400 hover:border-primary-500/50 hover:bg-surface/50 transition-all group"
                >
                    <Plus size={16} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Add Column</span>
                </button>
            )}
        </div>
    );
};
