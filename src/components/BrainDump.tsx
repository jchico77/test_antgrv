import React, { useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { KanbanBoard } from './KanbanBoard';
import { Plus } from 'lucide-react';

export const BrainDump: React.FC = () => {
    const { tasks, addTask } = useTaskStore();
    const [inputValue, setInputValue] = useState('');

    // Filter for inbox tasks (or all tasks for now, if we treat Brain Dump as "All")
    // Usually Brain Dump = Inbox (projectId = 'inbox')
    const inboxTasks = tasks.filter(t => t.projectId === 'inbox' && !t.isCompleted);
    const completedTasks = tasks.filter(t => t.projectId === 'inbox' && t.isCompleted);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            addTask(inputValue, 'inbox');
            setInputValue('');
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-text-primary mb-2 uppercase tracking-tight">Brain Dump</h1>
                <p className="text-text-muted text-sm">Offload your memory buffer to inbox.</p>
            </header>

            {/* Quick Add Input */}
            <form onSubmit={handleSubmit} className="mb-8 relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Plus className="text-primary-500" size={24} />
                </div>
                <input
                    autoFocus
                    type="text"
                    placeholder="INPUT TASK DATA..."
                    className="w-full pl-12 pr-4 py-4 text-lg bg-surface rounded-sm border border-border shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all placeholder:text-text-muted font-mono text-text-primary"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                    <span className="text-[10px] text-text-muted font-mono font-medium bg-border/50 px-2 py-1 rounded-sm uppercase tracking-wide">Enter to Save</span>
                </div>
            </form>

            {/* Active Tasks */}
            <section className="mb-8 h-[calc(100vh-250px)] overflow-x-auto pb-4">
                <KanbanBoard project={{ id: 'inbox', name: 'INBOX', color: 'bg-primary-500', isArchived: false, columns: [{ id: 'todo', title: 'INBOX', order: 0 }, { id: 'done', title: 'PROCESSED', order: 1 }] }} tasks={[...inboxTasks, ...completedTasks]} />
            </section>
        </div>
    );
};
