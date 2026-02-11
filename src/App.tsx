import { useState, useEffect } from 'react';
import { useTaskStore } from './store/useTaskStore';
import { Layout } from './components/Layout';
import { BrainDump } from './components/BrainDump';
import { ProjectView } from './components/ProjectView';
import { FocusMode } from './components/FocusMode';
import { FocusWidget } from './components/FocusWidget';
import { PlanView } from './components/PlanView';
import { SettingsView } from './components/SettingsView';

function App() {
  const { currentView, currentProjectId, setCurrentView, setCurrentProjectId } = useTaskStore();

  // Simple route check for widget
  const [isWidgetMode, setIsWidgetMode] = useState(window.location.search.includes('mode=widget'));

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
