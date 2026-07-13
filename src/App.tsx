import { useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useStore } from './store/useStore';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ProjectsPage from './pages/ProjectsPage';
import ProjectView from './pages/ProjectView';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const { userId, setUser, fetchAll, theme } = useStore();

  // Тема: auto / light / dark
  useEffect(() => {
    const apply = () => {
      const dark =
        theme === 'dark' ||
        (theme === 'auto' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  // Auth сесия
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [setUser]);

  useEffect(() => {
    if (userId) fetchAll();
  }, [userId, fetchAll]);

  if (!userId) return <AuthPage />;

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectView />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <nav className="tabbar">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="ico">🏠</span>Начало
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="ico">🏗️</span>Проекти
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="ico">⚙️</span>Настройки
        </NavLink>
      </nav>
    </div>
  );
}
