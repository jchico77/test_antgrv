import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Task, Project, UserSettings, Subtask, Attachment } from '../types';
import { supabase } from '../lib/supabase';

interface TaskState {
    tasks: Task[];
    projects: Project[];
    settings: UserSettings;
    userXP: number;
    streak: number;
    lastCompletedDate: string | null;
    isFocusMode: boolean;
    selectedTaskId: string | null;
    isLoading: boolean;

    // Actions
    fetchData: () => Promise<void>;
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
    planTask: (taskId: string, time?: string) => void;
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
        (set, get) => ({
            tasks: [],
            projects: DEFAULT_PROJECTS,
            settings: {
                isDarkMode: true,
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
            isLoading: false,

            fetchData: async () => {
                set({ isLoading: true });
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    set({ isLoading: false });
                    return;
                }

                // Fetch Projects
                const { data: projectsData, error: projectsError } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: true });

                if (projectsError) console.error('Error fetching projects:', projectsError);

                // Fetch Tasks with Subtasks and Attachments
                const { data: tasksData, error: tasksError } = await supabase
                    .from('tasks')
                    .select(`
                        *,
                        subtasks (*),
                        attachments (*)
                    `)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (tasksError) console.error('Error fetching tasks:', tasksError);

                // Map data to local types
                const mappedProjects: Project[] = projectsData
                    ? projectsData.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        color: p.color,
                        isArchived: false,
                        columns: [ // Columns are not in DB yet, using default for now
                            { id: 'todo', title: 'TO DO', order: 0 },
                            { id: 'in-progress', title: 'IN PROGRESS', order: 1 },
                            { id: 'done', title: 'DONE', order: 2 }
                        ]
                    }))
                    : [];

                // Merge with default projects (inbox, work, personal) if they don't exist in DB
                // Actually, if we migrated, they should be in DB (except 'inbox' maybe).
                // Let's keep 'inbox' as a virtual project always available locally.
                const mergedProjects = [
                    DEFAULT_PROJECTS[0], // Keep Brain Dump/Inbox
                    ...mappedProjects
                ];

                const mappedTasks: Task[] = tasksData
                    ? tasksData.map((t: any) => ({
                        id: t.id,
                        title: t.title,
                        description: t.description,
                        isCompleted: t.is_completed,
                        projectId: t.project_id || 'inbox',
                        status: t.status || 'todo',
                        priority: t.priority || 'medium',
                        createdAt: new Date(t.created_at),
                        plannedDate: t.planned_date,
                        plannedTime: t.planned_time,
                        duration: t.duration,
                        content: t.content,
                        subtasks: t.subtasks?.map((st: any) => ({
                            id: st.id,
                            title: st.title,
                            isCompleted: st.is_completed
                        })) || [],
                        attachments: t.attachments?.map((att: any) => ({
                            id: att.id,
                            name: att.name,
                            size: att.size,
                            type: att.type,
                            data: att.data, // Should be url later
                            createdAt: new Date(att.created_at).getTime()
                        })) || []
                    }))
                    : [];

                set({
                    projects: mergedProjects,
                    tasks: mappedTasks,
                    isLoading: false
                });
            },

            selectTask: (taskId) => set({ selectedTaskId: taskId }),

            updateTaskContent: async (taskId, content) => {
                // Optimistic
                set((state) => ({
                    tasks: state.tasks.map(t => t.id === taskId ? { ...t, content } : t)
                }));
                // Sync
                await supabase.from('tasks').update({ content }).eq('id', taskId);
            },

            addAttachment: async (taskId, attachment) => {
                // Optimistic
                set((state) => ({
                    tasks: state.tasks.map(t =>
                        t.id === taskId
                            ? { ...t, attachments: [...(t.attachments || []), attachment] }
                            : t
                    )
                }));

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Sync
                await supabase.from('attachments').insert({
                    id: attachment.id,
                    task_id: taskId,
                    user_id: user.id,
                    name: attachment.name,
                    size: attachment.size,
                    type: attachment.type,
                    data: attachment.data, // Storing base64 for now as per schema
                    storage_path: ''
                });
            },

            deleteAttachment: async (taskId, attachmentId) => {
                // Optimistic
                set((state) => ({
                    tasks: state.tasks.map(t =>
                        t.id === taskId
                            ? { ...t, attachments: t.attachments?.filter(a => a.id !== attachmentId) }
                            : t
                    )
                }));
                // Sync
                await supabase.from('attachments').delete().eq('id', attachmentId);
            },

            addTask: async (title, projectId = 'inbox') => {
                const tempId = uuidv4();
                const newTask: Task = {
                    id: tempId,
                    title,
                    isCompleted: false,
                    projectId,
                    subtasks: [],
                    priority: 'medium',
                    status: 'todo',
                    createdAt: new Date(),
                };

                // Optimistic
                set((state) => ({ tasks: [newTask, ...state.tasks] }));

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Sync
                try {
                    const { error } = await supabase.from('tasks').insert({
                        id: tempId,
                        user_id: user.id,
                        project_id: projectId === 'inbox' ? null : projectId,
                        title,
                        is_completed: false,
                        status: 'todo',
                        priority: 'medium',
                        created_at: new Date().toISOString()
                    });
                    if (error) console.error("Error adding task:", error);
                } catch (e) {
                    console.error("Exception adding task:", e);
                }
            },

            updateTaskStatus: async (taskId, status) => {
                const isCompleted = status === 'done';
                // Optimistic
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === taskId ? {
                            ...t,
                            status: status as any,
                            isCompleted
                        } : t
                    )
                }));
                // Sync
                await supabase.from('tasks').update({ status, is_completed: isCompleted }).eq('id', taskId);
            },

            moveTask: async (taskId, projectId) => {
                // Optimistic
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === taskId ? { ...t, projectId } : t
                    )
                }));
                // Sync
                await supabase.from('tasks').update({ project_id: projectId === 'inbox' ? null : projectId }).eq('id', taskId);
            },

            toggleTask: async (taskId) => {
                // Optimistic Calculation
                const state = get();
                const task = state.tasks.find((t) => t.id === taskId);
                if (!task) return;

                const isNowCompleted = !task.isCompleted;
                const newStatus = isNowCompleted ? 'done' : 'todo';
                const today = new Date().toDateString();
                let newStreak = state.streak;
                let lastDate = state.lastCompletedDate;

                if (isNowCompleted && lastDate !== today) {
                    newStreak += 1;
                    lastDate = today;
                }

                set({
                    tasks: state.tasks.map((t) =>
                        t.id === taskId ? { ...t, isCompleted: isNowCompleted, status: newStatus as any } : t
                    ),
                    streak: newStreak,
                    lastCompletedDate: lastDate,
                });

                // Sync
                await supabase.from('tasks').update({
                    is_completed: isNowCompleted,
                    status: newStatus
                }).eq('id', taskId);

                // TODO: Update Streak in Profile (needs profile update logic)
            },

            deleteTask: async (taskId) => {
                set((state) => ({
                    tasks: state.tasks.filter((t) => t.id !== taskId),
                }));
                await supabase.from('tasks').delete().eq('id', taskId);
            },

            addSubtask: async (taskId, title) => {
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

                // Sync (Need to find task to verify ownership? RLS handles it)
                // We don't have user_id in subtasks in schema currently (only via join), 
                // Wait, RLS on subtasks uses join. So insert should be fine if task exists.
                // But insert needs to NOT fail. 
                // My schema didn't have user_id on subtasks.
                await supabase.from('subtasks').insert({
                    id: newSubtask.id,
                    task_id: taskId,
                    title,
                    is_completed: false
                });
            },

            toggleSubtask: async (taskId, subtaskId) => {
                let newIsCompleted = false;
                set((state) => ({
                    tasks: state.tasks.map((t) => {
                        if (t.id !== taskId) return t;
                        const subtasks = t.subtasks.map(s => {
                            if (s.id === subtaskId) {
                                newIsCompleted = !s.isCompleted;
                                return { ...s, isCompleted: newIsCompleted };
                            }
                            return s;
                        });
                        return { ...t, subtasks };
                    })
                }));

                await supabase.from('subtasks').update({ is_completed: newIsCompleted }).eq('id', subtaskId);
            },

            addProject: async (name, color) => {
                const newId = uuidv4();
                const newProject: Project = {
                    id: newId,
                    name,
                    color,
                    columns: [], // Defaults managed by component or backend
                    isArchived: false,
                };
                set((state) => ({ projects: [...state.projects, newProject] }));

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                await supabase.from('projects').insert({
                    id: newId,
                    user_id: user.id,
                    name,
                    color
                });
            },

            deleteProject: async (projectId) => {
                set((state) => ({
                    projects: state.projects.filter((p) => p.id !== projectId),
                    tasks: state.tasks.filter((t) => t.projectId !== projectId),
                    currentProjectId: state.currentProjectId === projectId ? 'inbox' : state.currentProjectId
                }));
                await supabase.from('projects').delete().eq('id', projectId);
            },

            // Plan / Date Actions
            planTask: (_taskId, _time) => {
                // Deprecated
            },

            assignTaskToDate: async (taskId, dateStr) => {
                set((state) => ({
                    tasks: state.tasks.map(t => t.id === taskId ? { ...t, plannedDate: dateStr } : t)
                }));
                await supabase.from('tasks').update({ planned_date: dateStr }).eq('id', taskId);
            },

            assignTaskToTimeSlot: async (taskId, dateStr, timeStr) => {
                set((state) => ({
                    tasks: state.tasks.map(t => t.id === taskId ? { ...t, plannedDate: dateStr, plannedTime: timeStr } : t)
                }));
                await supabase.from('tasks').update({ planned_date: dateStr, planned_time: timeStr }).eq('id', taskId);
            },

            // Column actions (Local only for now or need schema update)
            // Schema didn't have columns table. We just have projects.
            // For now, keep columns in local state or project settings?
            // Project table has no columns field.
            // Let's implement local-only for columns basically, or they reset on reload.
            // TODO: Add 'columns' jsonb to projects table in Supabase to persist board state.
            addColumn: (_projectId, _title) => { /* logic */ },
            updateColumn: (_projectId, _columnId, _title) => { /* logic */ },
            deleteColumn: (_projectId, _columnId) => { /* logic */ },

            // Navigation
            currentView: 'inbox',
            currentProjectId: 'inbox', // 'inbox' is default selection
            setCurrentView: (view) => set({ currentView: view }),
            setCurrentProjectId: (id) => set({ currentProjectId: id }),
            navigateToProject: (projectId) => set({ currentView: 'project', currentProjectId: projectId }),

            updateSettings: (newSettings) => {
                set((state) => ({ settings: { ...state.settings, ...newSettings } }));
                // TODO: Sync settings to profiles table
            },

            checkStreak: () => { /* logic */ },
            setFocusMode: (isFocusMode) => set({ isFocusMode })

        }),
        {
            name: 'focus-flow-storage',
        }
    )
);
