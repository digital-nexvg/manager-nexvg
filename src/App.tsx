import { useEffect, useState } from 'react';
import './App.css';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ClientesPage } from './pages/ClientesPage';
import { PagamentosPage } from './pages/PagamentosPage';
import { LoginPage } from './pages/LoginPage';

type SectionKey = 'dashboard' | 'clientes' | 'financeiro';

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

    const params = new URLSearchParams(window.location.search);
    const redirectPath = params.get('redirect');

    if (redirectPath) {
      const normalizedPath = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
      window.history.replaceState({}, '', normalizedPath);
      return normalizedPath;
    }

    return window.location.pathname === '/' ? '/login' : window.location.pathname;
  });
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.innerWidth < 900;
  });
  const [activeSection, setActiveSection] = useState<SectionKey>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncRoute = () => {
      const params = new URLSearchParams(window.location.search);
      const redirectPath = params.get('redirect');
      const nextRoute = redirectPath
        ? (redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`)
        : (window.location.pathname === '/' ? '/login' : window.location.pathname);

      if (!isAuthenticated && nextRoute !== '/login') {
        window.history.replaceState({}, '', '/login');
        setRoute('/login');
        return;
      }

      if (redirectPath && nextRoute !== window.location.pathname) {
        window.history.replaceState({}, '', nextRoute);
      }

      setRoute(nextRoute);
    };

    const handleResize = () => setIsMobile(window.innerWidth < 900);

    window.addEventListener('popstate', syncRoute);
    window.addEventListener('resize', handleResize);
    syncRoute();
    handleResize();

    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('resize', handleResize);
    };
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

  const handleSectionChange = (section: SectionKey) => {
    setActiveSection(section);
    setIsMenuOpen(false);
  };

  if (!isAuthenticated || route === '/login') {
    return <LoginPage onLogin={handleLogin} onForgotPassword={handleForgotPassword} />;
  }

  const mobileMenu = (
    <nav className={`mobile-nav ${isMenuOpen ? 'is-open' : ''}`} aria-label="Navegação do painel">
      <button type="button" className={`mobile-nav__button ${activeSection === 'dashboard' ? 'is-active' : ''}`} onClick={() => handleSectionChange('dashboard')}>
        Dashboard
      </button>
      <button type="button" className={`mobile-nav__button ${activeSection === 'clientes' ? 'is-active' : ''}`} onClick={() => handleSectionChange('clientes')}>
        Clientes
      </button>
      <button type="button" className={`mobile-nav__button ${activeSection === 'financeiro' ? 'is-active' : ''}`} onClick={() => handleSectionChange('financeiro')}>
        Financeiro
      </button>
      <button type="button" className="mobile-nav__button mobile-nav__button--logout" onClick={handleLogout}>
        Sair
      </button>
    </nav>
  );

  return (
    <main className="app-shell">
      {isMobile ? (
        <>
          {activeSection === 'dashboard' ? (
            <DashboardOverview
              onToggleMenu={() => setIsMenuOpen((current) => !current)}
              isMobile={isMobile}
              mobileMenu={mobileMenu}
            />
          ) : null}
          {activeSection === 'clientes' ? (
            <>
              {mobileMenu}
              <ClientesPage />
            </>
          ) : null}
          {activeSection === 'financeiro' ? (
            <>
              {mobileMenu}
              <PagamentosPage />
            </>
          ) : null}
        </>
      ) : (
        <>
          <DashboardOverview />
          <ClientesPage />
          <PagamentosPage />
        </>
      )}
    </main>
  );
}

export default App;
