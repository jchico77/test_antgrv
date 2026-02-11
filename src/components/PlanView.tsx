import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { cn } from '../lib/utils';
import { Calendar as CalendarIcon, GripVertical, CheckCircle2, FileText } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, isSameDay } from 'date-fns';

export const PlanView: React.FC = () => {
    const { tasks, toggleTask, settings, assignTaskToTimeSlot, assignTaskToDate, selectTask, selectedTaskId } = useTaskStore();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [viewMode, setViewMode] = useState<'today' | 'tomorrow' | 'thisWeek' | 'nextWeek'>('today');

    // Update time every minute
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    // --- Helpers & Computed Date ---
    const getTargetDate = () => {
        const today = new Date();
        switch (viewMode) {
            case 'today': return today;
            case 'tomorrow': return addDays(today, 1);
            case 'thisWeek': return startOfWeek(today, { weekStartsOn: 1 });
            case 'nextWeek': return addWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1);
            default: return today;
        }
    };

    const targetDate = getTargetDate(); // For day views, this is THE day. For week views, this is the START of the week.
    const dateKey = format(targetDate, 'yyyy-MM-dd');

    // Unplanned: Tasks with NO plannedDate
    const backlogTasks = tasks.filter(t => !t.isCompleted && !t.plannedDate);

    // Tasks for the specific DAY view
    const dayTasks = tasks.filter(t => !t.isCompleted && t.plannedDate === dateKey);
    const dayTasksTimed = dayTasks.filter(t => t.plannedTime);
    const dayTasksUntimed = dayTasks.filter(t => !t.plannedTime);

    // --- Helpers ---
    const isToday = isSameDay(targetDate, new Date());

    // Generate time slots 00:00 - 23:30
    const timeSlots: string[] = [];
    for (let i = 0; i < 24; i++) {
        timeSlots.push(`${i.toString().padStart(2, '0')}:00`);
        timeSlots.push(`${i.toString().padStart(2, '0')}:30`);
    }

    const isActiveHour = (timeStr: string) => {
        const hour = parseInt(timeStr.split(':')[0]);
        if (settings.endOfDay < settings.startOfDay) {
            return hour >= settings.startOfDay || hour < settings.endOfDay;
        }
        return hour >= settings.startOfDay && hour < settings.endOfDay;
    };

    const isPast = (timeStr: string) => {
        if (viewMode !== 'today') return false; // Only today has "past" hours relevant for display dimming
        if (!isToday && targetDate < new Date()) return true; // Past days
        if (!isToday && targetDate > new Date()) return false; // Future days

        const [hours, minutes] = timeStr.split(':').map(Number);
        const taskTime = new Date();
        taskTime.setHours(hours, minutes, 0, 0);
        return taskTime < currentTime;
    };

    // --- Drag Handlers ---
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
    };

    // Drop on Sidebar -> Unplan (Remove Date)
    const handleUnplan = (e: React.DragEvent) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        if (taskId) assignTaskToDate(taskId, undefined);
    };

    // Drop on Untimed Bin -> Set Date, Clear Time
    const handleDropUntimed = (e: React.DragEvent) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        if (taskId) assignTaskToTimeSlot(taskId, dateKey, undefined);
    };

    // Drop on Time Slot -> Set Date & Time
    const handleDropTimeSlot = (e: React.DragEvent, time: string) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        if (taskId) assignTaskToTimeSlot(taskId, dateKey, time);
    };

    // --- Week View Render Helpers ---
    const renderWeekView = () => {
        const weekStart = targetDate; // Already calculated based on viewMode
        // Generate 7 days, then filter for Mon-Fri (assuming weekStart is Monday)
        // Generate Mon-Fri
        const weekDays = Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i));

        const timeBlocks = [
            { label: 'Morning', startHour: 9, endHour: 12 },
            { label: 'Afternoon', startHour: 13, endHour: 17 },
            { label: 'Evening', startHour: 17, endHour: 23 }
        ];

        const getBlockStyle = (label: string) => {
            const baseOpacity = settings.blockOpacity || 0.1;
            const color = settings.blockColor || 'neutral';

            // Subtle variants based on selection
            const colorMap: Record<string, string> = {
                neutral: 'bg-gray-500',
                blue: 'bg-blue-500',
                green: 'bg-green-500',
                purple: 'bg-purple-500',
                rose: 'bg-rose-500'
            };

            const textColorMap: Record<string, string> = {
                neutral: 'text-gray-400',
                blue: 'text-blue-400',
                green: 'text-green-400',
                purple: 'text-purple-400',
                rose: 'text-rose-400'
            };

            return {
                bgClass: colorMap[color],
                textClass: textColorMap[color],
                style: { opacity: baseOpacity }
            };
        };

        const getBlockForTime = (timeStr?: string) => {
            if (!timeStr) return 'Morning';
            const hour = parseInt(timeStr.split(':')[0]);
            if (hour < 12) return 'Morning';
            if (hour < 17) return 'Afternoon';
            return 'Evening';
        };

        return (
            <div className="flex-1 h-full overflow-hidden p-4">
                <div className="flex h-full gap-2 w-full">
                    {weekDays.map(day => {
                        const dKey = format(day, 'yyyy-MM-dd');
                        const isDayToday = isSameDay(day, new Date());
                        const tasksForDay = tasks.filter(t => !t.isCompleted && t.plannedDate === dKey);

                        return (
                            <div
                                key={dKey}
                                className={cn(
                                    "flex-1 flex flex-col rounded-lg border min-w-0 bg-surface/10",
                                    isDayToday ? "border-primary-500/30" : "border-border"
                                )}
                            >
                                {/* Day Header */}
                                <div className={cn(
                                    "p-2 border-b border-border text-center overflow-hidden flex flex-col justify-center min-h-[50px]",
                                    isDayToday && "bg-primary-500/10"
                                )}>
                                    <div className="text-[10px] uppercase font-bold text-text-muted truncate">{format(day, 'EEEE')}</div>
                                    <div className={cn("text-sm font-bold truncate", isDayToday ? "text-primary-400" : "text-text-primary")}>
                                        {format(day, 'd MMM')}
                                    </div>
                                </div>

                                {/* Time Blocks */}
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    {timeBlocks.map((block) => {
                                        const blockTasks = tasksForDay.filter(t => getBlockForTime(t.plannedTime) === block.label);
                                        const { bgClass, textClass } = getBlockStyle(block.label);
                                        // Dynamic inline style for background opacity is simpler than tailwind arbitrary values for variable opacity

                                        return (
                                            <div
                                                key={block.label}
                                                className={cn(
                                                    "flex-1 flex flex-col p-1 border-b border-border/50 last:border-0 min-h-0 relative group transition-colors"
                                                )}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const taskId = e.dataTransfer.getData("taskId");
                                                    // Assign to start of block
                                                    const time = `${block.startHour.toString().padStart(2, '0')}:00`;
                                                    if (taskId) assignTaskToTimeSlot(taskId, dKey, time);
                                                }}
                                            >
                                                {/* Subtle Background Layer */}
                                                <div
                                                    className={cn("absolute inset-0 pointer-events-none transition-opacity", bgClass)}
                                                    style={{ opacity: settings.blockOpacity || 0.05 }}
                                                />

                                                <div className="text-[10px] font-bold uppercase px-1 mb-1 flex justify-between items-center relative z-10 opacity-60 group-hover:opacity-100">
                                                    <span className={textClass}>{block.label}</span>
                                                    <span className="text-[9px] opacity-50 text-text-muted">{blockTasks.length > 0 ? blockTasks.length : ''}</span>
                                                </div>

                                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 relative z-10">
                                                    {blockTasks.map(task => (
                                                        <div
                                                            key={task.id}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, task.id)}
                                                            onClick={(e) => { e.stopPropagation(); selectTask(task.id); }}
                                                            className={cn(
                                                                "bg-surface border border-border p-1.5 rounded-sm text-xs hover:border-primary-500/50 cursor-pointer group/card shadow-sm transition-colors",
                                                                selectedTaskId === task.id ? "border-primary-500 bg-primary-500/10" : ""
                                                            )}
                                                        >
                                                            <div className="truncate font-medium text-text-primary group-hover/card:text-primary-200 transition-colors flex items-center gap-1">
                                                                <span className="truncate">{task.title}</span>
                                                                {task.content && <FileText size={8} className="text-text-secondary flex-shrink-0" />}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Drop Hint */}
                                                <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-background z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-text-primary uppercase tracking-tight flex items-center gap-2">
                        <CalendarIcon className="text-primary-500" />
                        {viewMode === 'today' && 'Today'}
                        {viewMode === 'tomorrow' && 'Tomorrow'}
                        {viewMode === 'thisWeek' && 'This Week'}
                        {viewMode === 'nextWeek' && 'Next Week'}
                    </h1>
                </div>

                <div className="flex bg-surface border border-border rounded p-1 gap-1">
                    <button
                        onClick={() => setViewMode('today')}
                        className={cn("px-4 py-1.5 text-xs font-bold rounded uppercase transition-colors", viewMode === 'today' ? "bg-primary-500 text-white" : "text-text-muted hover:text-text-primary hover:bg-white/5")}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setViewMode('tomorrow')}
                        className={cn("px-4 py-1.5 text-xs font-bold rounded uppercase transition-colors", viewMode === 'tomorrow' ? "bg-primary-500 text-white" : "text-text-muted hover:text-text-primary hover:bg-white/5")}
                    >
                        Tomorrow
                    </button>
                    <div className="w-px bg-border my-1 mx-1" />
                    <button
                        onClick={() => setViewMode('thisWeek')}
                        className={cn("px-4 py-1.5 text-xs font-bold rounded uppercase transition-colors", viewMode === 'thisWeek' ? "bg-primary-500 text-white" : "text-text-muted hover:text-text-primary hover:bg-white/5")}
                    >
                        This Week
                    </button>
                    <button
                        onClick={() => setViewMode('nextWeek')}
                        className={cn("px-4 py-1.5 text-xs font-bold rounded uppercase transition-colors", viewMode === 'nextWeek' ? "bg-primary-500 text-white" : "text-text-muted hover:text-text-primary hover:bg-white/5")}
                    >
                        Next Week
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar: Unplanned Backlog */}
                <div
                    className="w-1/4 max-w-[300px] min-w-[250px] flex flex-col bg-surface/30 border-r border-border p-4"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleUnplan}
                >
                    <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center justify-between">
                        Backlog ({backlogTasks.length})
                    </h2>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {backlogTasks.map(task => (
                            <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task.id)}
                                onClick={() => selectTask(task.id)}
                                className={cn(
                                    "bg-surface border border-border p-3 rounded-sm cursor-pointer hover:border-primary-500/50 transition-colors group flex items-center gap-2",
                                    selectedTaskId === task.id ? "border-primary-500 bg-primary-500/5" : ""
                                )}
                            >
                                <GripVertical size={14} className="text-text-muted" />
                                <span className="text-sm text-text-primary truncate flex-1">{task.title}</span>
                                {task.content && <FileText size={12} className="text-text-secondary" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                {(viewMode === 'thisWeek' || viewMode === 'nextWeek') ? renderWeekView() : (
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
                        {/* Day View - Untimed Bin */}
                        <div
                            className="mb-6 bg-surface/20 border border-border border-dashed rounded-lg p-4 transition-colors hover:bg-surface/30"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDropUntimed}
                        >
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Planned for {format(targetDate, 'EEEE, d MMM')} (Any time)</h3>
                            <div className="flex flex-wrap gap-2">
                                {dayTasksUntimed.map(task => (
                                    <div
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        onClick={() => selectTask(task.id)}
                                        className={cn(
                                            "bg-surface border border-border px-3 py-1.5 rounded-full flex items-center gap-2 cursor-pointer hover:border-primary-500 transition-colors",
                                            selectedTaskId === task.id ? "border-primary-500 bg-primary-500/10" : ""
                                        )}
                                    >
                                        <span className="text-sm">{task.title}</span>
                                        {task.content && <FileText size={10} className="text-text-secondary" />}
                                        <button onClick={(e) => { e.stopPropagation(); assignTaskToDate(task.id, undefined); }} className="text-text-muted hover:text-red-400">×</button>
                                    </div>
                                ))}
                                {dayTasksUntimed.length === 0 && (
                                    <span className="text-xs text-text-secondary italic opacity-80">Drag tasks here to assign to this day without a specific time.</span>
                                )}
                            </div>
                        </div>

                        {/* Day View - Timeline */}
                        <div className="space-y-0.5">
                            {timeSlots.map(time => {
                                const inPast = isPast(time);
                                const tasksInSlot = dayTasksTimed.filter(t => t.plannedTime === time);
                                const active = isActiveHour(time);

                                return (
                                    <div
                                        key={time}
                                        className={cn(
                                            "flex gap-4 group min-h-[50px]",
                                            (inPast && !active) ? "opacity-30" : ""
                                        )}
                                        onDragOver={(e) => !inPast && e.preventDefault()}
                                        onDrop={(e) => !inPast && handleDropTimeSlot(e, time)}
                                    >
                                        <div className="w-14 flex-shrink-0 text-right pt-2 border-r border-border pr-2">
                                            <span className={cn(
                                                "text-xs font-mono",
                                                active ? "text-primary-400 font-bold" : "text-text-muted opacity-50"
                                            )}>
                                                {time}
                                            </span>
                                        </div>

                                        <div className={cn(
                                            "flex-1 border-t border-border/30 pt-1 relative transition-colors ml-2",
                                            active ? "bg-surface/5" : "",
                                            !inPast && "group-hover:bg-surface/10"
                                        )}>
                                            {tasksInSlot.length === 0 && !inPast && isActiveHour(time) && (
                                                <div className="absolute inset-0 pt-2 pl-2 text-text-secondary text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                                    Click or drop to plan
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                {tasksInSlot.map(task => (
                                                    <div
                                                        key={task.id}
                                                        draggable={!inPast}
                                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                                        onClick={(e) => { e.stopPropagation(); selectTask(task.id); }}
                                                        className={cn(
                                                            "bg-surface/80 border p-2 rounded-sm flex items-center gap-3 relative overflow-hidden cursor-pointer transition-all",
                                                            "border-border/50 hover:border-primary-500/30",
                                                            selectedTaskId === task.id ? "border-primary-500 bg-primary-500/5 ring-1 ring-primary-500/20" : ""
                                                        )}
                                                    >
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                                                            className="text-text-muted hover:text-green-500 transition-colors"
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </button>

                                                        <span className="text-sm font-medium text-text-primary truncate flex-1">
                                                            {task.title}
                                                        </span>

                                                        {task.content && <FileText size={12} className="text-text-secondary mr-2" />}

                                                        <GripVertical size={14} className={cn("ml-auto text-text-muted cursor-grab", inPast && "cursor-not-allowed")} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
