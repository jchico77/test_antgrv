import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { Play, Pause, Square, CheckCircle, SkipForward, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export const FocusMode: React.FC = () => {
    const { tasks, toggleTask } = useTaskStore();

    // Find the highest priority incomplete task, or just the first one
    const activeTask = tasks.find(t => !t.isCompleted);

    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
    const [isActive, setIsActive] = useState(false);
    const [isBreak, setIsBreak] = useState(false);

    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            // Timer finished sound play here
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
    };

    const handleComplete = () => {
        if (activeTask) {
            toggleTask(activeTask.id);
            // Auto-switch to break?
            setIsBreak(true);
            setTimeLeft(5 * 60);
            setIsActive(false);
        }
    };

    const openMiniWidget = () => {
        // Open a small window at the top right - Compact Focus Widget
        const width = 320;
        const height = 200;
        const left = window.screen.width - width;
        const top = 0;

        window.open(
            `${window.location.origin}?mode=widget`,
            'FocusFlowWidget',
            `popup=yes,width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no,location=no,scrollbars=no,resizable=yes`
        );
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (!activeTask) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-xl font-bold text-text-primary mb-2 uppercase tracking-wide">NO ACTIVE TASKS</h2>
                <p className="text-text-muted text-sm">ADD TASKS TO BRAIN DUMP TO INITIALIZE FOCUS SEQUENCE.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-xl mx-auto text-center relative">

            {/* Mini Mode Trigger */}
            <button
                onClick={openMiniWidget}
                className="absolute top-0 right-0 p-2 text-text-muted hover:text-primary-400 flex items-center gap-2 text-sm border border-transparent hover:border-border rounded"
            >
                <ExternalLink size={16} />
                <span>Mini Mode</span>
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
            >
                <div className="mb-4 uppercase tracking-widest text-xs font-bold text-text-muted">
                    {isBreak ? 'STATUS: RECHARGE_CYCLE' : 'STATUS: FOCUS_ENGAGED'}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-12 leading-tight">
                    {isBreak ? "SYSTEM COOLING DOWN" : activeTask.title.toUpperCase()}
                </h1>

                {/* Timer Circle */}
                <div className="relative w-64 h-64 mx-auto mb-12 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="128"
                            cy="128"
                            r="120"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-surface"
                        />
                        <motion.circle
                            cx="128"
                            cy="128"
                            r="120"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className={cn(isBreak ? "text-green-500" : "text-primary-500")}
                            strokeDasharray={2 * Math.PI * 120}
                            strokeDashoffset={((2 * Math.PI * 120) * (1 - timeLeft / (isBreak ? 5 * 60 : 25 * 60)))}
                            strokeLinecap="square"
                        />
                    </svg>
                    <div className="absolute text-5xl font-mono font-medium text-text-primary tracking-tighter">
                        {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                    <button
                        onClick={toggleTimer}
                        className="w-16 h-16 rounded-sm bg-surface border border-primary-500 text-primary-500 flex items-center justify-center hover:bg-primary-900/20 transition-all shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                    >
                        {isActive ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
                    </button>

                    {!isBreak && (
                        <button
                            onClick={handleComplete}
                            className="w-16 h-16 rounded-sm bg-primary-900 border border-primary-500 text-primary-400 flex items-center justify-center hover:bg-primary-800 transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                            title="Complete Task"
                        >
                            <CheckCircle size={32} />
                        </button>
                    )}

                    <button
                        onClick={resetTimer}
                        className="w-12 h-12 rounded-sm bg-surface border border-border text-text-muted flex items-center justify-center hover:text-text-primary transition-colors"
                    >
                        <Square size={20} />
                    </button>
                </div>

                {!isBreak && (
                    <button className="mt-8 text-text-muted hover:text-text-primary text-xs font-mono uppercase flex items-center mx-auto tracking-wider">
                        <SkipForward size={12} className="mr-2" />
                        SKIP SEQUENCE
                    </button>
                )}

            </motion.div>
        </div>
    );
};
