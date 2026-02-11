import { useState, useEffect } from 'react';
import { useTaskStore } from './store/useTaskStore';
import { supabase } from './lib/supabase';
import { Layout } from './components/Layout';
import { BrainDump } from './components/BrainDump';
import { ProjectView } from './components/ProjectView';
import { FocusMode } from './components/FocusMode';
import { FocusWidget } from './components/FocusWidget';
import { PlanView } from './components/PlanView';
import { SettingsView } from './components/SettingsView';
import { AuthForm } from './components/Auth';
import { Loader2 } from 'lucide-react';
import { migrateLocalDataToSupabase } from './lib/store-migration';
import type { Session } from '@supabase/supabase-js';

function App() {
  const { currentView, currentProjectId, setCurrentView, setCurrentProjectId } = useTaskStore();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Simple route check for widget
  const [isWidgetMode, setIsWidgetMode] = useState(window.location.search.includes('mode=widget'));

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        migrateLocalDataToSupabase(session.user.id);
        useTaskStore.getState().fetchData();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setSession(session);
      if (session?.user) {
        migrateLocalDataToSupabase(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');

      if (mode === 'widget') {
        setIsWidgetMode(true);
      } else {
        setIsWidgetMode(false);
      }
    };

    handlePopState(); // Check on mount
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-primary-500">
        <Loader2 size={48} className="animate-spin" />
      </div>
    );
  }

  // Widget Mode bypasses Auth for now (or handles it internally if needed later)
  // But strictly speaking, widget should also be protected. 
  // For now, let's protect everything except if we want a public widget? No, protect it.
  if (!session) {
    return <AuthForm onLogin={() => { }} />;
  }

  if (isWidgetMode) {
    return <FocusWidget />;
  }

  const handleNavigate = (view: string, projectId?: string) => {
    setCurrentView(view);
    if (projectId) {
      setCurrentProjectId(projectId);
    } else {
      setCurrentProjectId(null);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'inbox':
        return <BrainDump />;
      case 'plan':
        return <PlanView />;
      case 'project':
        return currentProjectId ? <ProjectView projectId={currentProjectId} /> : <BrainDump />;
      case 'focus':
        return <FocusMode />;
      case 'settings':
        return <SettingsView />;
      default:
        return <BrainDump />;
    }
  };

  return (
    <Layout
      currentView={currentView}
      currentProjectId={currentProjectId}
      onNavigate={handleNavigate}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
