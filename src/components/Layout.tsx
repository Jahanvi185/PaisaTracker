import { ReactNode } from 'react';
import {
  LayoutDashboard,
  Smartphone,
  BookOpen,
  Package,
  Banknote,
  Bell,
} from 'lucide-react';

export type Page = 'dashboard' | 'upi' | 'udhaar' | 'stock' | 'cash' | 'reminders';

const navItems: { page: Page; icon: ReactNode; label: string }[] = [
  { page: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { page: 'upi', icon: <Smartphone size={20} />, label: 'UPI' },
  { page: 'udhaar', icon: <BookOpen size={20} />, label: 'Udhaar' },
  { page: 'stock', icon: <Package size={20} />, label: 'Stock' },
  { page: 'cash', icon: <Banknote size={20} />, label: 'Cash' },
  { page: 'reminders', icon: <Bell size={20} />, label: 'Reminders' },
];

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}

export default function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-teal-700 text-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-teal-700 font-bold text-lg">P</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight">PaisaTracker</h1>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 md:hidden">
        <div className="flex justify-around items-center py-1">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${
                currentPage === item.page
                  ? 'text-teal-700'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <nav className="hidden md:flex fixed left-0 top-14 bottom-0 w-56 bg-white border-r border-gray-200 flex-col py-4 z-20">
        {navItems.map((item) => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={`flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
              currentPage === item.page
                ? 'text-teal-700 bg-teal-50 border-r-2 border-teal-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
