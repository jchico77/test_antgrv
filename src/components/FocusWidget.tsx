import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { Play, Pause, CheckCircle } from 'lucide-react';

const MOTIVATIONAL_QUOTES = [
    "Focus allows you to see clearly.",
    "One task at a time.",
    "Deep work is valuable.",
    "Distraction is the enemy of progress.",
    "You are capable of amazing things.",
    "Stay present.",
    "Quality over quantity.",
    "Don't stop when you're tired. Stop when you're done.",
    "Your future is created by what you do today.",
    "Focus on the step in front of you."
];

export const FocusWidget: React.FC = () => {
    const { tasks, toggleTask } = useTaskStore();

    // Logic: Active task or first incomplete
    const activeTask = tasks.find(t => !t.isCompleted);

    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [quoteIndex, setQuoteIndex] = useState(0);

    // Timer Logic
    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    // Quote Rotation Logic (Every 60s)
    useEffect(() => {
        const interval = setInterval(() => {
            setQuoteIndex(prev => (prev + 1) % MOTIVATIONAL_QUOTES.length);
        }, 60000); // 1 minute
        return () => clearInterval(interval);
    }, []);

    if (!activeTask) {
        return (
            <div className="h-screen w-screen bg-background text-text-primary flex items-center justify-center p-4 text-center">
                <div>
                    <h2 className="text-lg font-bold mb-2">All Clear!</h2>
                    <p className="text-text-muted text-sm">Close this window or add tasks.</p>
                </div>
            </div>
        );
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="h-screen w-screen bg-background text-text-primary flex flex-col p-2 relative overflow-hidden drag-region border-l-4 border-primary-500 selection:bg-primary-500/30">

            {/* Visual Background Pulse */}
            {isActive && (
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <div className="w-full h-full bg-primary-500 blur-[40px] animate-pulse" />
                </div>
            )}

            {/* Top Row: Timer & Controls */}
            <div className="flex items-center justify-between mb-1">
                <div className="text-3xl font-bold font-mono text-primary-400 tabular-nums tracking-tighter leading-none select-none">
                    {formatTime(timeLeft)}
                </div>

                <div className="flex items-center gap-2 no-drag-region">
                    <button
                        onClick={() => setIsActive(!isActive)}
                        className="w-8 h-8 rounded-full bg-surface border border-primary-500/30 flex items-center justify-center text-primary-400 hover:bg-primary-500 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-sm"
                    >
                        {isActive ? <Pause fill="currentColor" size={12} /> : <Play fill="currentColor" className="ml-0.5" size={12} />}
                    </button>

                    <button
                        onClick={() => toggleTask(activeTask.id)}
                        className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-text-muted hover:text-green-400 hover:border-green-500 transition-all hover:scale-105 active:scale-95 shadow-sm"
                        title="Complete Task"
                    >
                        <CheckCircle size={14} />
                    </button>
                </div>
            </div>

            {/* Bottom Row: Task Info */}
            <div className="flex-1 min-h-0 flex flex-col justify-center">
                <div className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-0.5 select-none opacity-70">Focusing On</div>
                <div className="text-sm font-bold text-text-primary leading-tight line-clamp-2 select-none" title={activeTask.title}>
                    {activeTask.title}
                </div>

                {/* Quote Cycle */}
                <div className="mt-1 pt-1 border-t border-border/30">
                    <p className="text-[10px] text-text-muted italic opacity-80 truncate select-none">
                        "{MOTIVATIONAL_QUOTES[quoteIndex]}"
                    </p>
                </div>
            </div>

            {/* Global Styles for drag region */}
            <style>{`
                .drag-region {
                    -webkit-app-region: drag;
                }
                .no-drag-region, button {
                    -webkit-app-region: no-drag;
                }
            `}</style>
        </div>
    );
};
