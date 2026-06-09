import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Smartphone, Search } from 'lucide-react';

interface UPIPayment {
  id: string;
  amount: number;
  upi_id: string | null;
  customer_name: string | null;
  description: string | null;
  received_at: string;
}

export default function UPIPayments() {
  const [payments, setPayments] = useState<UPIPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    amount: '',
    upi_id: '',
    customer_name: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('upi_payments')
      .select('*')
      .order('received_at', { ascending: false });

    if (!error && data) setPayments(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount) return;
    setSubmitting(true);

    const { error } = await supabase.from('upi_payments').insert({
      amount: parseFloat(form.amount),
      upi_id: form.upi_id || null,
      customer_name: form.customer_name || null,
      description: form.description || null,
    });

    if (!error) {
      setForm({ amount: '', upi_id: '', customer_name: '', description: '' });
      setShowForm(false);
      loadPayments();
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('upi_payments').delete().eq('id', id);
    if (!error) setPayments((prev) => prev.filter((p) => p.id !== id));
  }

  const filtered = payments.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.customer_name?.toLowerCase().includes(q)) ||
      (p.upi_id?.toLowerCase().includes(q)) ||
      (p.description?.toLowerCase().includes(q))
    );
  });

  const todayTotal = payments
    .filter((p) => {
      const today = new Date().toISOString().split('T')[0];
      return p.received_at.startsWith(today);
    })
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">UPI Payments</h2>
          <p className="text-sm text-gray-500 mt-1">Today: ₹{todayTotal.toLocaleString('en-IN')}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Add
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-4 space-y-3">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Customer Name</label>
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className="input-field"
                placeholder="Customer name"
              />
            </div>
            <div>
              <label className="label">UPI ID</label>
              <input
                type="text"
                value={form.upi_id}
                onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                className="input-field"
                placeholder="name@upi"
              />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field"
              placeholder="Medicine sale, etc."
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : 'Save Payment'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9"
          placeholder="Search by name, UPI ID, or description..."
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Smartphone size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No UPI payments recorded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="card flex items-center justify-between group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    ₹{Number(p.amount).toLocaleString('en-IN')}
                  </span>
                  {p.customer_name && (
                    <span className="text-sm text-gray-600 truncate">{p.customer_name}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {p.upi_id && (
                    <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                      {p.upi_id}
                    </span>
                  )}
                  {p.description && (
                    <span className="text-xs text-gray-400 truncate">{p.description}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(p.received_at).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
