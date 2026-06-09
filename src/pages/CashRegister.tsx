import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Banknote, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface CashEntry {
  id: string;
  type: 'cash_sale' | 'cash_in' | 'cash_out' | 'expense';
  amount: number;
  description: string | null;
  created_at: string;
}

const typeLabels: Record<CashEntry['type'], { label: string; color: string; icon: React.ReactNode }> = {
  cash_sale: { label: 'Cash Sale', color: 'bg-teal-100 text-teal-700', icon: <ArrowUpRight size={14} /> },
  cash_in: { label: 'Cash In', color: 'bg-green-100 text-green-700', icon: <ArrowUpRight size={14} /> },
  cash_out: { label: 'Cash Out', color: 'bg-red-100 text-red-700', icon: <ArrowDownRight size={14} /> },
  expense: { label: 'Expense', color: 'bg-orange-100 text-orange-700', icon: <ArrowDownRight size={14} /> },
};

export default function CashRegister() {
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'cash_sale' as CashEntry['type'], amount: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadEntries(); }, []);

  async function loadEntries() {
    setLoading(true);
    const { data, error } = await supabase
      .from('cash_register')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setEntries(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount) return;
    setSubmitting(true);
    const { error } = await supabase.from('cash_register').insert({
      type: form.type,
      amount: parseFloat(form.amount),
      description: form.description || null,
    });
    if (!error) {
      setForm({ type: 'cash_sale', amount: '', description: '' });
      setShowForm(false);
      loadEntries();
    }
    setSubmitting(false);
  }

  const todayEntries = entries.filter((e) => {
    const today = new Date().toISOString().split('T')[0];
    return e.created_at.startsWith(today);
  });

  const cashIn = todayEntries
    .filter((e) => e.type === 'cash_sale' || e.type === 'cash_in')
    .reduce((s, e) => s + Number(e.amount), 0);
  const cashOut = todayEntries
    .filter((e) => e.type === 'cash_out' || e.type === 'expense')
    .reduce((s, e) => s + Number(e.amount), 0);
  const balance = cashIn - cashOut;
  const isShortage = balance < 0;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cash Register</h2>
          <p className="text-sm text-gray-500 mt-1">Track daily cash flow</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Entry
        </button>
      </div>

      <div className={`rounded-2xl p-5 mb-4 ${isShortage ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-teal-600 to-teal-700'} text-white shadow-lg`}>
        <p className="text-sm font-medium opacity-90">Today's Cash Balance</p>
        <p className="text-3xl font-bold mt-1">₹{Math.abs(balance).toLocaleString('en-IN')}</p>
        {isShortage && (
          <div className="flex items-center gap-2 mt-2 bg-white/20 rounded-lg px-3 py-2">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">Cash Shortage! You are in the negative today.</span>
          </div>
        )}
        <div className="flex gap-6 mt-3 text-sm opacity-90">
          <span>Cash In: ₹{cashIn.toLocaleString('en-IN')}</span>
          <span>Cash Out: ₹{cashOut.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-4 space-y-3">
          <div>
            <label className="label">Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(typeLabels).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, type: key as CashEntry['type'] })}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.type === key
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {val.icon}
                  {val.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="input-field"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field"
              placeholder="What's this for?"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : 'Save Entry'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading...</div>
      ) : todayEntries.length === 0 ? (
        <div className="text-center py-12">
          <Banknote size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No cash entries today</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Today's Entries</h3>
          {todayEntries.map((e) => {
            const meta = typeLabels[e.type];
            const isOutflow = e.type === 'cash_out' || e.type === 'expense';
            return (
              <div key={e.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${meta.color}`}>
                    {meta.icon}
                    {meta.label}
                  </span>
                  <div>
                    <span className={`font-semibold ${isOutflow ? 'text-red-600' : 'text-gray-900'}`}>
                      {isOutflow ? '-' : '+'}₹{Number(e.amount).toLocaleString('en-IN')}
                    </span>
                    {e.description && <p className="text-xs text-gray-400 mt-0.5">{e.description}</p>}
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(e.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
