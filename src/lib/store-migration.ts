import { supabase } from './supabase';
import { useTaskStore } from '../store/useTaskStore';

export const migrateLocalDataToSupabase = async (userId: string) => {
    const state = useTaskStore.getState();
    const localTasks = state.tasks;
    const localProjects = state.projects;

    if (localTasks.length === 0 && localProjects.length === 0) return;

    // Check if user already has data to avoid duplicates/overwrite
    const { count } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', userId);

    if (count && count > 0) {
        console.log("User already has data in Supabase. Skipping migration.");
        return;
    }

    console.log("Migrating local data to Supabase...");

    // 1. Migrate Projects
    // const projectsToInsert = localProjects.map(p => ({
    //     id: p.id,
    //     user_id: userId,
    //     name: p.name,
    //     color: p.color,
    //     is_archived: p.isArchived 
    // }));

    // Filter out 'inbox' if we treat it as default system project? 
    // Actually, our schema allows projects. Let's just insert them.
    // Ensure 'inbox' ID clashes doesn't break things if we use UUIDs.
    // If 'inbox' is a string 'inbox', it's not a UUID. Supabase expects UUID for ID?
    // Project ID in schema is UUID. 'inbox' is not valid UUID.
    // Strategy: Don't upload 'inbox' project definition (it's virtual/default). 
    // Tasks in 'inbox' -> project_id = null.

    // const validProjects = projectsToInsert.filter(p => p.id !== 'inbox' && p.id !== 'personal' && p.id !== 'work');
    // Wait, 'personal' and 'work' are also default IDs in our store? 
    // If they are not UUIDs, we should map them or skip them and just rely on new UUIDs?
    // Better: Allow them to be created as real projects with new UUIDs, 
    // and update tasks to point to these new UUIDs.

    // FOR SIMPLICITY v1: Only migrate custom projects if they have valid UUIDs or just skip migration of static projects
    // and let user recreate them?
    // BETTER: Map legacy IDs to new UUIDs.

    const idMapping: Record<string, string> = {};

    for (const p of localProjects) {
        if (['inbox', 'work', 'personal'].includes(p.id)) {
            // Create these as real projects?
            // Or just map 'inbox' to null (no project).
            // Map 'work' and 'personal' to new projects.
            if (p.id === 'inbox') continue;
        }

        const newId = crypto.randomUUID();
        idMapping[p.id] = newId;

        await supabase.from('projects').insert({
            id: newId,
            user_id: userId,
            name: p.name,
            color: p.color
        });
    }

    // 2. Migrate Tasks
    const tasksToInsert = localTasks.map(t => ({
        user_id: userId,
        project_id: idMapping[t.projectId] || null, // 'inbox' maps to null
        title: t.title,
        description: t.description,
        content: t.content,
        is_completed: t.isCompleted,
        status: t.status,
        priority: t.priority,
        created_at: t.createdAt,
        planned_date: t.plannedDate,
        planned_time: t.plannedTime,
        duration: t.duration
    }));

    if (tasksToInsert.length > 0) {
        const { error } = await supabase.from('tasks').insert(tasksToInsert);
        if (error) console.error("Error migrating tasks", error);
    }

    // 3. Clear Local Storage (Optional, maybe keep as cache?)
    // For now, let's not clear, but next sync will start fresh from server?
    // If we switch to "Server First" mode, we should reload page or clear store.

    // Reload to fetch fresh from server
    window.location.reload();
};
