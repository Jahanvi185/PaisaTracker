import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  TrendingUp,
  TrendingDown,
  Smartphone,
  BookOpen,
  Banknote,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  RefreshCw,
} from 'lucide-react';

interface TodayStats {
  cashSales: number;
  upiSales: number;
  totalInflow: number;
  expenses: number;
  netEarning: number;
  pendingUdhaar: number;
  unpaidBills: number;
  lowStockCount: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<TodayStats>({
    cashSales: 0,
    upiSales: 0,
    totalInflow: 0,
    expenses: 0,
    netEarning: 0,
    pendingUdhaar: 0,
    unpaidBills: 0,
    lowStockCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    setError(null);

    const today = new Date().toISOString().split('T')[0];
    const todayStart = `${today}T00:00:00`;
    const todayEnd = `${today}T23:59:59`;

    const [cashRes, upiRes, expenseRes, udhaarRes, billsRes, stockRes] = await Promise.all([
      supabase
        .from('cash_register')
        .select('type, amount')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd),
      supabase
        .from('upi_payments')
        .select('amount')
        .gte('received_at', todayStart)
        .lte('received_at', todayEnd),
      supabase
        .from('cash_register')
        .select('amount')
        .in('type', ['expense', 'cash_out'])
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd),
      supabase
        .from('udhaar_entries')
        .select('amount')
        .eq('status', 'pending'),
      supabase
        .from('supplier_bills')
        .select('amount')
        .eq('status', 'unpaid'),
      supabase
        .from('medicine_stock')
        .select('quantity')
        .lt('quantity', 10),
    ]);

    const errors = [cashRes, upiRes, expenseRes, udhaarRes, billsRes, stockRes]
      .filter((r) => r.error)
      .map((r) => r.error!.message);

    if (errors.length > 0) {
      setError(errors.join('; '));
      setLoading(false);
      return;
    }

    const cashRows = cashRes.data || [];
    const cashSales = cashRows
      .filter((r) => r.type === 'cash_sale')
      .reduce((s, r) => s + Number(r.amount), 0);
    const cashIn = cashRows
      .filter((r) => r.type === 'cash_in')
      .reduce((s, r) => s + Number(r.amount), 0);

    const upiSales = (upiRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
    const expenses = (expenseRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
    const totalInflow = cashSales + cashIn + upiSales;
    const netEarning = totalInflow - expenses;
    const pendingUdhaar = (udhaarRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
    const unpaidBills = (billsRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
    const lowStockCount = (stockRes.data || []).length;

    setStats({ cashSales, upiSales, totalInflow, expenses, netEarning, pendingUdhaar, unpaidBills, lowStockCount });
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading today's report...</div>
      </div>
    );
  }

  const isProfit = stats.netEarning >= 0;

  return (
    <div className="page-container">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Today's Report</h2>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">&times;</button>
        </div>
      )}

      <div className={`rounded-2xl p-6 mb-6 ${isProfit ? 'bg-gradient-to-br from-teal-600 to-teal-700' : 'bg-gradient-to-br from-red-500 to-red-600'} text-white shadow-lg`}>
        <div className="flex items-center gap-2 mb-1 opacity-90">
          {isProfit ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          <span className="text-sm font-medium">
            {isProfit ? "Today's Net Earning" : "Today's Net Loss"}
          </span>
        </div>
        <div className="text-4xl font-bold">
          ₹{Math.abs(stats.netEarning).toLocaleString('en-IN')}
        </div>
        <div className="mt-3 flex gap-6 text-sm opacity-90">
          <span className="flex items-center gap-1">
            <ArrowUpRight size={14} />
            Inflow: ₹{stats.totalInflow.toLocaleString('en-IN')}
          </span>
          <span className="flex items-center gap-1">
            <ArrowDownRight size={14} />
            Expenses: ₹{stats.expenses.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-gray-500">
            <Banknote size={16} />
            <span className="text-xs font-medium">Cash Sales</span>
          </div>
          <span className="text-xl font-bold text-gray-900">₹{stats.cashSales.toLocaleString('en-IN')}</span>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-gray-500">
            <Smartphone size={16} />
            <span className="text-xs font-medium">UPI Payments</span>
          </div>
          <span className="text-xl font-bold text-gray-900">₹{stats.upiSales.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="space-y-3">
        {stats.pendingUdhaar > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle size={20} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Udhaar Pending</p>
              <p className="text-xs text-amber-600">₹{stats.pendingUdhaar.toLocaleString('en-IN')} outstanding from customers</p>
            </div>
          </div>
        )}
        {stats.unpaidBills > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <BookOpen size={20} className="text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Supplier Bills Unpaid</p>
              <p className="text-xs text-red-600">₹{stats.unpaidBills.toLocaleString('en-IN')} due to suppliers</p>
            </div>
          </div>
        )}
        {stats.lowStockCount > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200">
            <Package size={20} className="text-orange-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-800">Low Stock Alert</p>
              <p className="text-xs text-orange-600">{stats.lowStockCount} medicine(s) below 10 units</p>
            </div>
          </div>
        )}
        {stats.pendingUdhaar === 0 && stats.unpaidBills === 0 && stats.lowStockCount === 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-teal-50 border border-teal-200">
            <TrendingUp size={20} className="text-teal-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-teal-800">All Clear!</p>
              <p className="text-xs text-teal-600">No pending alerts. Business is running smoothly.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
