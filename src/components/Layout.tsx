import React from 'react';
import { Sidebar } from './Sidebar';
import { TaskDetailPanel } from './TaskDetailPanel';
import { useTaskStore } from '../store/useTaskStore';
import { cn } from '../lib/utils';

interface LayoutProps {
    children: React.ReactNode;
    currentView: string;
    currentProjectId: string | null;
    onNavigate: (view: string, projectId?: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
    children,
    currentView,
    currentProjectId,
    onNavigate
}) => {
    const { selectedTaskId } = useTaskStore();

    return (
        <div className="flex h-screen bg-background text-text-primary overflow-hidden font-sans selection:bg-primary-500/30 selection:text-primary-200">
            <Sidebar
                currentView={currentView}
                currentProjectId={currentProjectId}
                onNavigate={onNavigate}
            />
            <main className="flex-1 flex flex-col min-w-0 bg-background m-0 rounded-none overflow-hidden relative border-l border-border transition-all duration-300 ease-in-out">
                <div className="flex h-full">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 relative">
                        <div className="max-w-6xl mx-auto h-full">
                            {children}
                        </div>
                    </div>

                    {/* Sliding Panel */}
                    <div className={cn(
                        "transition-all duration-300 ease-in-out overflow-hidden border-l border-border bg-surface shadow-2xl z-20",
                        selectedTaskId ? "w-[400px] translate-x-0 opacity-100" : "w-0 translate-x-full opacity-0 border-none"
                    )}>
                        <TaskDetailPanel />
                    </div>
                </div>
            </main>
        </div>
    );
};
