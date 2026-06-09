import { useState } from 'react';
import Layout, { Page } from './components/Layout';
import Dashboard from './pages/Dashboard';
import UPIPayments from './pages/UPIPayments';
import UdhaarBook from './pages/UdhaarBook';
import MedicineStock from './pages/MedicineStock';
import CashRegister from './pages/CashRegister';
import Reminders from './pages/Reminders';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  function renderPage() {
    switch (page) {
      case 'dashboard':
        return <Dashboard />;
      case 'upi':
        return <UPIPayments />;
      case 'udhaar':
        return <UdhaarBook />;
      case 'stock':
        return <MedicineStock />;
      case 'cash':
        return <CashRegister />;
      case 'reminders':
        return <Reminders />;
    }
  }

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      <div className="md:ml-56">
        {renderPage()}
      </div>
    </Layout>
  );
}
