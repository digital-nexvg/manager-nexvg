import { useEffect, useState } from 'react';
import './App.css';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ClientesPage } from './pages/ClientesPage';
import { LeadsPage } from './pages/LeadsPage';
import { PagamentosPage } from './pages/PagamentosPage';
import { TarefasPage } from './pages/TarefasPage';
import { LoginPage } from './pages/LoginPage';
import { getLeads } from './services/leadService';
import { readStorage, writeStorage } from './services/storage';

type SectionKey = 'dashboard' | 'clientes' | 'leads' | 'financeiro' | 'tarefas';
const LEAD_ACK_STORAGE_KEY = 'nexvg-leads-acknowledged';

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
  const [leadNotificationCount, setLeadNotificationCount] = useState(0);
  const [acknowledgedLeadIds, setAcknowledgedLeadIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    return readStorage<string[]>(LEAD_ACK_STORAGE_KEY, []);
  });

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
    if (!isAuthenticated) {
      return;
    }

    let isMounted = true;

    const refreshLeadNotifications = async () => {
      const leads = await getLeads();
      const unreadLeads = leads.filter(
       (lead) => lead.origin === 'Formulário' && !acknowledgedLeadIds.includes(lead.id),
      );
      const count = unreadLeads.length;

      if (isMounted) {
       setLeadNotificationCount(count);
      }
    };

    refreshLeadNotifications();
    const timer = window.setInterval(refreshLeadNotifications, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [acknowledgedLeadIds, isAuthenticated]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    writeStorage(LEAD_ACK_STORAGE_KEY, acknowledgedLeadIds);
  }, [acknowledgedLeadIds]);

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

  const handleAcknowledgeLead = (leadId: string) => {
    setAcknowledgedLeadIds((current) => (current.includes(leadId) ? current : [...current, leadId]));
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
      <button type="button" className={`mobile-nav__button ${activeSection === 'leads' ? 'is-active' : ''}`} onClick={() => handleSectionChange('leads')}>
        Leads {leadNotificationCount > 0 ? `(${leadNotificationCount})` : ''}
      </button>
      <button type="button" className={`mobile-nav__button ${activeSection === 'financeiro' ? 'is-active' : ''}`} onClick={() => handleSectionChange('financeiro')}>
        Financeiro
      </button>
      <button type="button" className={`mobile-nav__button ${activeSection === 'tarefas' ? 'is-active' : ''}`} onClick={() => handleSectionChange('tarefas')}>
        Tarefas
      </button>
      <button type="button" className="mobile-nav__button mobile-nav__button--logout" onClick={handleLogout}>
        Sair
      </button>
    </nav>
  );

  return (
    <main className="app-shell">
      {isAuthenticated && isMobile ? (
        <button
          type="button"
          className="app-shell__mobile-menu-fab"
          onClick={() => setIsMenuOpen((current) => !current)}
          aria-label="Abrir menu"
        >
          <span className="app-shell__mobile-menu-fab-icon">☰</span>
          {leadNotificationCount > 0 ? <span className="app-shell__mobile-menu-fab-badge">{leadNotificationCount}</span> : null}
        </button>
      ) : null}
      {isMobile ? (
        <>
          {activeSection === 'dashboard' ? (
            <DashboardOverview
              onToggleMenu={undefined}
              isMobile={isMobile}
              mobileMenu={mobileMenu}
            />
          ) : null}
          {activeSection === 'clientes' ? (
            <>
              {mobileMenu}
              <div className="mobile-nav__back-wrap">
                <button type="button" className="btn btn--secondary" onClick={() => handleSectionChange('dashboard')}>
                  Voltar para o início
                </button>
              </div>
              <ClientesPage />
            </>
          ) : null}
          {activeSection === 'leads' ? (
            <>
              {mobileMenu}
              <div className="mobile-nav__back-wrap">
                <button type="button" className="btn btn--secondary" onClick={() => handleSectionChange('dashboard')}>
                  Voltar para o início
                </button>
              </div>
              <LeadsPage notificationCount={leadNotificationCount} isMobile={isMobile} onAcknowledgeLead={handleAcknowledgeLead} />
            </>
          ) : null}
          {activeSection === 'financeiro' ? (
            <>
              {mobileMenu}
              <div className="mobile-nav__back-wrap">
                <button type="button" className="btn btn--secondary" onClick={() => handleSectionChange('dashboard')}>
                  Voltar para o início
                </button>
              </div>
              <PagamentosPage />
            </>
          ) : null}
          {activeSection === 'tarefas' ? (
            <>
              {mobileMenu}
              <div className="mobile-nav__back-wrap">
                <button type="button" className="btn btn--secondary" onClick={() => handleSectionChange('dashboard')}>
                  Voltar para o início
                </button>
              </div>
              <TarefasPage />
            </>
          ) : null}
        </>
      ) : (
        <>
          <DashboardOverview />
          <ClientesPage />
          <LeadsPage notificationCount={leadNotificationCount} isMobile={isMobile} onAcknowledgeLead={handleAcknowledgeLead} />
          <PagamentosPage />
          <TarefasPage />
        </>
      )}
    </main>
  );
}

export default App;
