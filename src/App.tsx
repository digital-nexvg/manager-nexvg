import { useEffect, useState } from 'react';
import './App.css';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ClientesPage } from './pages/ClientesPage';
import { PagamentosPage } from './pages/PagamentosPage';
import { LoginPage } from './pages/LoginPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem('nexvg-auth') === 'true';
  });
  const [route, setRoute] = useState(() => {
    if (typeof window === 'undefined') {
      return '/login';
    }

    return window.location.pathname === '/' ? '/login' : window.location.pathname;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncRoute = () => {
      const nextRoute = window.location.pathname === '/' ? '/login' : window.location.pathname;

      if (!isAuthenticated && nextRoute !== '/login') {
        window.history.replaceState({}, '', '/login');
        setRoute('/login');
        return;
      }

      setRoute(nextRoute);
    };

    window.addEventListener('popstate', syncRoute);
    syncRoute();

    return () => window.removeEventListener('popstate', syncRoute);
  }, [isAuthenticated]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('nexvg-auth', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  const navigateTo = (nextRoute: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.history.pushState({}, '', nextRoute);
    setRoute(nextRoute);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    navigateTo('/dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    navigateTo('/login');
  };

  const handleForgotPassword = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const subject = encodeURIComponent('Redefinição de senha - Nexvg Manager');
    const body = encodeURIComponent('Olá, gostaria de redefinir minha senha do Nexvg Manager.');
    window.location.href = `mailto:contatonexvg@gmail.com?subject=${subject}&body=${body}`;
  };

  if (!isAuthenticated || route === '/login') {
    return <LoginPage onLogin={handleLogin} onForgotPassword={handleForgotPassword} />;
  }

  return (
    <main className="app-shell">
      <div className="app-header-actions">
        <button type="button" className="logout-button" onClick={handleLogout}>
          Sair
        </button>
      </div>
      <DashboardOverview />
      <ClientesPage />
      <PagamentosPage />
    </main>
  );
}

export default App;
