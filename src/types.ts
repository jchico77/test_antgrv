export type Priority = 'low' | 'medium' | 'high';

export interface Subtask {
    id: string;
    title: string;
    isCompleted: boolean;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    isCompleted: boolean;
    projectId: string; // 'inbox' for Brain Dump
    status: 'todo' | 'in-progress' | 'done';
    subtasks: Subtask[];
    dueDate?: number; // timestamp
    plannedDate?: string; // YYYY-MM-DD
    content?: string; // Rich text / Markdown content
    plannedTime?: string; // ISO string for planning (YYYY-MM-DDTHH:mm) or just HH:mm if simple
    duration?: number; // estimated duration in minutes
    priority: Priority;
    createdAt: Date;
    attachments?: Attachment[];
}

export interface Attachment {
    id: string;
    name: string;
    type: string;
    size: number;
    data: string; // Base64
    createdAt: number;
}

export interface Column {
    id: string;
    title: string;
    order: number;
}

export interface Project {
    id: string;
    name: string;
    color: string;
    icon?: string;
    isArchived: boolean;
    columns?: Column[];
}

export interface UserSettings {
    isDarkMode: boolean;
    enableSound: boolean;
    enableConfetti: boolean;
    dailyGoal: number; // Number of tasks
    startOfDay: number; // Hour (0-23)
    endOfDay: number; // Hour (0-23)
    blockColor: string; // 'blue' | 'green' | 'purple' | 'neutral'
    blockOpacity: number; // 0.05 - 0.5
}
