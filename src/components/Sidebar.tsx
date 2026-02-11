import React, { useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { cn } from '../lib/utils';
import {
    Inbox,
    Briefcase,
    Settings,
    Plus,
    ChevronLeft,
    ChevronRight,
    Target,
    Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
    currentView: string; // 'inbox' | 'project' | 'focus' | 'settings'
    currentProjectId: string | null;
    onNavigate: (view: string, projectId?: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, currentProjectId, onNavigate }) => {
    const { projects, addProject, streak } = useTaskStore();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isAddingProject, setIsAddingProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    const handleAddProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProjectName.trim()) {
            addProject(newProjectName, 'bg-gray-400'); // Default color, can be customized later
            setNewProjectName('');
            setIsAddingProject(false);
        }
    };

    const NavItem = ({
        icon: Icon,
        label,
        isActive,
        onClick,
        colorClass = "text-text-muted"
    }: {
        icon: any,
        label: string,
        isActive: boolean,
        onClick: () => void,
        colorClass?: string
    }) => (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center w-full p-2 mb-0.5 rounded-sm transition-all duration-100 group border border-transparent",
                isActive
                    ? "bg-surface border-border text-primary-400 shadow-none"
                    : "hover:bg-surface text-text-secondary hover:text-text-primary"
            )}
        >
            <Icon
                className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-primary-500" : colorClass,
                    !isCollapsed && "mr-3"
                )}
            />
            {!isCollapsed && (
                <span className="truncate text-xs font-medium group-hover:text-primary-400 transition-colors uppercase tracking-wider">{label}</span>
            )}
            {isActive && !isCollapsed && (
                <div className="ml-auto w-1 h-1 rounded-none bg-primary-500" />
            )}
        </button>
    );

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 60 : 240 }}
            className="h-screen bg-background border-r border-border flex flex-col p-2 relative z-20"
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-6 bg-surface border border-border rounded-sm p-0.5 text-text-muted hover:text-text-primary hover:border-primary-500 transition-colors z-50"
            >
                {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>

            {/* Logo Area */}
            <div className={cn("flex items-center mb-10 px-2", isCollapsed ? "justify-center" : "")}>
                <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-primary-500/20">
                    FF
                </div>
                {!isCollapsed && (
                    <span className="ml-3 font-bold text-sm text-text-primary tracking-wide">FocusFlow</span>
                )}
            </div>

            {/* Streak Counter - kept minimal */}
            {!isCollapsed && streak > 0 && (
                <div className="mb-4 mx-1 p-1.5 bg-surface border border-border rounded-sm flex items-center justify-center text-orange-500 text-xs">
                    <Flame size={12} className="mr-1.5" />
                    <span>STREAK: {streak}</span>
                </div>
            )}

            {/* Main Nav */}
            <div className="space-y-0.5">
                <NavItem
                    icon={Inbox}
                    label="Inbox"
                    isActive={currentView === 'inbox'}
                    onClick={() => onNavigate('inbox')}
                />
                <NavItem
                    icon={Target}
                    label="Plan"
                    isActive={currentView === 'plan'}
                    onClick={() => onNavigate('plan')}
                    colorClass="text-blue-400"
                />
                <NavItem
                    icon={Briefcase}
                    label="Focus Mode"
                    isActive={currentView === 'focus'}
                    onClick={() => onNavigate('focus')}
                    colorClass="text-secondary-400"
                />
            </div>

            <div className="my-4 border-t border-border" />

            {/* Projects */}
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                {!isCollapsed && (
                    <div className="flex items-center justify-between px-2 mb-2">
                        <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">Projects</h3>
                        <button
                            onClick={() => setIsAddingProject(true)}
                            className="text-text-muted hover:text-primary-400 transition-colors"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                )}

                <AnimatePresence>
                    {isAddingProject && !isCollapsed && (
                        <motion.form
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleAddProject}
                            className="mb-1 px-1"
                        >
                            <input
                                autoFocus
                                type="text"
                                placeholder="PROJECT_NAME..."
                                className="w-full text-xs p-1.5 bg-surface border border-primary-500/50 rounded-sm text-text-primary focus:outline-none focus:border-primary-500 placeholder:text-text-muted font-mono"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                onBlur={() => !newProjectName && setIsAddingProject(false)}
                            />
                        </motion.form>
                    )}
                </AnimatePresence>

                <div className="space-y-0.5">
                    {projects.map((project) => (
                        project.id !== 'inbox' && (
                            <NavItem
                                key={project.id}
                                icon={Briefcase}
                                label={project.name.toUpperCase()}
                                isActive={currentView === 'project' && currentProjectId === project.id}
                                onClick={() => onNavigate('project', project.id)}
                                colorClass={project.color.replace('bg-', 'text-')}
                            />
                        )
                    ))}
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-auto pt-2 border-t border-border">
                <NavItem
                    icon={Settings}
                    label="SYSTEM"
                    isActive={currentView === 'settings'}
                    onClick={() => onNavigate('settings')}
                />
            </div>
        </motion.aside>
    );
};
