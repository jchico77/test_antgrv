import React, { useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { KanbanBoard } from './KanbanBoard';
import { Plus, MoreVertical, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProjectViewProps {
    projectId: string;
}

export const ProjectView: React.FC<ProjectViewProps> = ({ projectId }) => {
    const { tasks, projects, addTask, deleteProject } = useTaskStore();
    const [inputValue, setInputValue] = useState('');
    const [showMenu, setShowMenu] = useState(false);

    const project = projects.find(p => p.id === projectId);

    if (!project) return <div>Project not found</div>;

    const projectTasks = tasks.filter(t => t.projectId === projectId && !t.isCompleted);
    const completedTasks = tasks.filter(t => t.projectId === projectId && t.isCompleted);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            addTask(inputValue, projectId);
            setInputValue('');
        }
    };

    const calculateProgress = () => {
        const total = projectTasks.length + completedTasks.length;
        if (total === 0) return 0;
        return Math.round((completedTasks.length / total) * 100);
    };

    const progress = calculateProgress();

    return (
        <div className="max-w-6xl mx-auto h-full flex flex-col">
            <header className="mb-6 flex items-start justify-between flex-shrink-0">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-3 h-3 rounded-full ${project.color.replace('bg-', 'bg-')}`} />
                        <h1 className="text-xl font-bold tracking-tight text-text-primary uppercase">{project.name}</h1>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-4 mt-2">
                        <div className="h-1.5 w-32 bg-surface rounded-full overflow-hidden border border-border">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                            />
                        </div>
                        <span className="text-xs font-mono text-text-muted">{progress}% DONE</span>
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1.5 text-text-muted hover:text-text-primary rounded-sm hover:bg-surface border border-transparent hover:border-border transition-all"
                    >
                        <MoreVertical size={16} />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-surface rounded-sm shadow-xl border border-border p-1 z-50">
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to delete this project?')) {
                                        deleteProject(projectId);
                                    }
                                }}
                                className="flex items-center w-full px-3 py-2 text-xs font-mono text-red-400 hover:bg-red-900/20 rounded-sm"
                            >
                                <Trash2 size={14} className="mr-2" />
                                DELETE PROJECT
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Quick Add Input */}
            <form onSubmit={handleSubmit} className="mb-6 relative group flex-shrink-0">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Plus className="text-primary-500" size={16} />
                </div>
                <input
                    type="text"
                    placeholder={`ADD TASK TO ${project.name.toUpperCase()}...`}
                    className="w-full pl-10 pr-4 py-3 text-sm bg-surface rounded-sm border border-border focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition-all placeholder:text-text-muted font-mono text-text-primary"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
            </form>

            {/* Kanban View */}
            <div className="flex-1 min-h-0 overflow-x-auto pb-4">
                <KanbanBoard project={project} tasks={[...projectTasks, ...completedTasks]} />
            </div>
        </div>
    );
};
