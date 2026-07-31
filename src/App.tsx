import './App.css';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { ClientesPage } from './pages/ClientesPage';
import { PagamentosPage } from './pages/PagamentosPage';

function App() {
  return (
    <main className="app-shell">
      <DashboardOverview />
      <ClientesPage />
      <PagamentosPage />
    </main>
  );
}

export default App
