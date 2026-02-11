import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Task, Project, UserSettings, Subtask, Attachment } from '../types';

interface TaskState {
    tasks: Task[];
    projects: Project[];
    settings: UserSettings;
    userXP: number;
    streak: number;
    lastCompletedDate: string | null;
    isFocusMode: boolean;
    selectedTaskId: string | null;

    // Actions
    selectTask: (taskId: string | null) => void;
    updateTaskContent: (taskId: string, content: string) => void;
    addAttachment: (taskId: string, attachment: Attachment) => void;
    deleteAttachment: (taskId: string, attachmentId: string) => void;
    addTask: (title: string, projectId?: string) => void;
    toggleTask: (taskId: string) => void;
    updateTaskStatus: (taskId: string, status: string) => void;
    moveTask: (taskId: string, projectId: string) => void;
    deleteTask: (taskId: string) => void;
    addSubtask: (taskId: string, title: string) => void;
    toggleSubtask: (taskId: string, subtaskId: string) => void;
    setFocusMode: (isFocusMode: boolean) => void;
    planTask: (taskId: string, time?: string) => void; // Deprecated-ish, use assignTaskToTimeSlot
    assignTaskToDate: (taskId: string, dateStr: string | undefined) => void;
    assignTaskToTimeSlot: (taskId: string, dateStr: string, timeStr: string | undefined) => void;
    addColumn: (projectId: string, title: string) => void;
    updateColumn: (projectId: string, columnId: string, title: string) => void;
    deleteColumn: (projectId: string, columnId: string) => void;
    addProject: (name: string, color: string) => void;
    deleteProject: (projectId: string) => void;

    currentView: string;
    currentProjectId: string | null;
    setCurrentView: (view: string) => void;
    setCurrentProjectId: (id: string | null) => void;
    navigateToProject: (projectId: string) => void;
    updateSettings: (settings: Partial<UserSettings>) => void;
    checkStreak: () => void;
}

const DEFAULT_PROJECTS: Project[] = [
    { id: 'inbox', name: 'Brain Dump', color: 'bg-gray-500', isArchived: false },
    { id: 'work', name: 'Work', color: 'bg-blue-500', isArchived: false },
    { id: 'personal', name: 'Personal', color: 'bg-green-500', isArchived: false },
];

export const useTaskStore = create<TaskState>()(
    persist(
        (set) => ({
            tasks: [],
            projects: DEFAULT_PROJECTS,
            settings: {
                isDarkMode: false,
                enableSound: true,
                enableConfetti: true,
                dailyGoal: 5,
                startOfDay: 9,
                endOfDay: 18,
                blockColor: 'neutral',
                blockOpacity: 0.1
            },
            userXP: 0,
            streak: 0,
            lastCompletedDate: null,
            isFocusMode: false,
            selectedTaskId: null,

            selectTask: (taskId) => set({ selectedTaskId: taskId }),

            updateTaskContent: (taskId, content) => {
                set((state) => ({
                    tasks: state.tasks.map(t => t.id === taskId ? { ...t, content } : t)
                }));
            },

            addAttachment: (taskId, attachment) => {
                set((state) => ({
                    tasks: state.tasks.map(t =>
                        t.id === taskId
                            ? { ...t, attachments: [...(t.attachments || []), attachment] }
                            : t
                    )
                }));
            },

            deleteAttachment: (taskId, attachmentId) => {
                set((state) => ({
                    tasks: state.tasks.map(t =>
                        t.id === taskId
                            ? { ...t, attachments: t.attachments?.filter(a => a.id !== attachmentId) }
                            : t
                    )
                }));
            },

            addTask: (title, projectId = 'inbox') => {
                const newTask: Task = {
                    id: uuidv4(),
                    title,
                    isCompleted: false,
                    projectId,
                    subtasks: [],
                    priority: 'medium',
                    status: 'todo',
                    createdAt: new Date(),
                };
                set((state) => ({ tasks: [...state.tasks, newTask] }));
            },

            updateTaskStatus: (taskId, status) => {
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === taskId ? {
                            ...t,
                            status: status as any,
                            isCompleted: status === 'done'
                        } : t
                    )
                }));
            },

            moveTask: (taskId, projectId) => {
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === taskId ? { ...t, projectId } : t
                    )
                }));
            },

            toggleTask: (taskId) => {
                set((state) => {
                    const task = state.tasks.find((t) => t.id === taskId);
                    if (!task) return state;

                    const isNowCompleted = !task.isCompleted;
                    const newStatus = isNowCompleted ? 'done' : 'todo';

                    // Streak Logic
                    let newStreak = state.streak;
                    let lastDate = state.lastCompletedDate;

                    if (isNowCompleted) {
                        const today = new Date().toDateString();
                        if (lastDate !== today) {
                            newStreak += 1;
                            lastDate = today;
                        }
                    }

                    return {
                        tasks: state.tasks.map((t) =>
                            t.id === taskId ? { ...t, isCompleted: isNowCompleted, status: newStatus as any } : t
                        ),
                        streak: newStreak,
                        lastCompletedDate: lastDate,
                    };
                });
            },

            deleteTask: (taskId) => {
                set((state) => ({
                    tasks: state.tasks.filter((t) => t.id !== taskId),
                }));
            },

            addSubtask: (taskId, title) => {
                const newSubtask: Subtask = {
                    id: uuidv4(),
                    title,
                    isCompleted: false,
                };
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === taskId ? { ...t, subtasks: [...t.subtasks, newSubtask] } : t
                    ),
                }));
            },

            toggleSubtask: (taskId, subtaskId) => {
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === taskId
                            ? {
                                ...t,
                                subtasks: t.subtasks.map((sub) =>
                                    sub.id === subtaskId ? { ...sub, isCompleted: !sub.isCompleted } : sub
                                ),
                            }
                            : t
                    ),
                }));
            },

            addColumn: (projectId, title) => {
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== projectId) return p;
                        const columns = p.columns || [];
                        const newColumn = {
                            id: crypto.randomUUID(),
                            title,
                            order: columns.length
                        };
                        return { ...p, columns: [...columns, newColumn] };
                    })
                }));
            },

            updateColumn: (projectId, columnId, title) => {
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== projectId) return p;
                        return {
                            ...p,
                            columns: p.columns?.map(c => c.id === columnId ? { ...c, title } : c)
                        };
                    })
                }));
            },

            deleteColumn: (projectId, columnId) => {
                set((state) => ({
                    projects: state.projects.map((p) => {
                        if (p.id !== projectId) return p;
                        const newColumns = p.columns?.filter(c => c.id !== columnId) || [];
                        return { ...p, columns: newColumns };
                    })
                }));
            },

            addProject: (name, color) => {
                const newProject: Project = {
                    id: uuidv4(),
                    name,
                    color,
                    columns: [
                        { id: 'todo', title: 'TO DO', order: 0 },
                        { id: 'in-progress', title: 'IN PROGRESS', order: 1 },
                        { id: 'done', title: 'DONE', order: 2 }
                    ],
                    isArchived: false,
                };
                set((state) => ({ projects: [...state.projects, newProject] }));
            },

            planTask: (taskId, time) => {
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === taskId
                            ? { ...t, plannedTime: time }
                            : t
                    ),
                }));
            },

            assignTaskToDate: (taskId, dateStr) => {
                set((state) => ({
                    tasks: state.tasks.map(t => t.id === taskId ? { ...t, plannedDate: dateStr, plannedTime: dateStr ? t.plannedTime : undefined } : t)
                }));
            },

            assignTaskToTimeSlot: (taskId, dateStr, timeStr) => {
                set((state) => ({
                    tasks: state.tasks.map(t => t.id === taskId ? { ...t, plannedDate: dateStr, plannedTime: timeStr } : t)
                }));
            },

            setFocusMode: (isFocusMode) => {
                // Focus mode state is currently local to the component in some places or url based? 
                // The interface has it, but it seems it might be missing from the State interface properties?
                // Let's check the State interface. It doesn't have `isFocusMode` property, only `setFocusMode` action.
                // We should add `isFocusMode` to the state if we want to track it globally.
                // For now, let's just implement a dummy or add the state property.
                // Looking at previous edits, I might have missed adding `isFocusMode` boolean to the interface.
                // But the user didn't ask for global focus mode state yet, just the mini widget.
                // However, `setFocusMode` is in the interface.
                // Let's add `isFocusMode` to state as well.
                set((state) => ({ ...state, isFocusMode }));
            },

            deleteProject: (projectId) => {
                set((state) => ({
                    projects: state.projects.filter((p) => p.id !== projectId),
                    tasks: state.tasks.filter((t) => t.projectId !== projectId),
                    currentProjectId: state.currentProjectId === projectId ? 'inbox' : state.currentProjectId
                }));
            },

            // Navigation Actions
            currentView: 'inbox',
            currentProjectId: 'inbox',
            setCurrentView: (view) => set({ currentView: view }),
            setCurrentProjectId: (id) => set({ currentProjectId: id }),
            navigateToProject: (projectId) => set({ currentView: 'project', currentProjectId: projectId }),

            updateSettings: (newSettings) => {
                set((state) => ({ settings: { ...state.settings, ...newSettings } }));
            },

            checkStreak: () => {
                // Implementation for checking if streak was broken (e.g., missed a day)
                // This could be called on app mount
                set((state) => {
                    if (!state.lastCompletedDate) return state;
                    const last = new Date(state.lastCompletedDate);
                    const today = new Date();
                    const diffTime = Math.abs(today.getTime() - last.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays > 2) { // Allow 1 day grace or strict next day? strict: > 1
                        // If more than 1 day passed since last completion, reset streak? 
                        // For ADHD, maybe be lenient or allow "freeze". 
                        // For now, simple reset if > 48 hours
                        return { streak: 0 };
                    }
                    return state;
                })
            }
        }),
        {
            name: 'focus-flow-storage',
        }
    )
);
