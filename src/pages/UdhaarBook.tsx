import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Check, Trash2, BookOpen, Search, UserPlus } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
}

interface UdhaarEntry {
  id: string;
  customer_id: string;
  amount: number;
  due_date: string | null;
  description: string | null;
  status: 'pending' | 'paid';
  paid_at: string | null;
  created_at: string;
  customers: Customer;
}

export default function UdhaarBook() {
  const [entries, setEntries] = useState<UdhaarEntry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
  const [form, setForm] = useState({
    customer_id: '',
    amount: '',
    due_date: '',
    description: '',
  });
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [entriesRes, customersRes] = await Promise.all([
      supabase
        .from('udhaar_entries')
        .select('*, customers(*)')
        .order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('name'),
    ]);

    if (!entriesRes.error && entriesRes.data) setEntries(entriesRes.data as UdhaarEntry[]);
    if (!customersRes.error && customersRes.data) setCustomers(customersRes.data);
    setLoading(false);
  }

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!customerForm.name) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from('customers')
      .insert({ name: customerForm.name, phone: customerForm.phone || null })
      .select()
      .single();

    if (!error && data) {
      setCustomers((prev) => [...prev, data]);
      setForm({ ...form, customer_id: data.id });
      setCustomerForm({ name: '', phone: '' });
      setShowCustomerForm(false);
    }
    setSubmitting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customer_id || !form.amount) return;
    setSubmitting(true);

    const { error } = await supabase.from('udhaar_entries').insert({
      customer_id: form.customer_id,
      amount: parseFloat(form.amount),
      due_date: form.due_date || null,
      description: form.description || null,
      status: 'pending',
    });

    if (!error) {
      setForm({ customer_id: '', amount: '', due_date: '', description: '' });
      setShowForm(false);
      loadData();
    }
    setSubmitting(false);
  }

  async function markPaid(id: string) {
    const { error } = await supabase
      .from('udhaar_entries')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) loadData();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('udhaar_entries').delete().eq('id', id);
    if (!error) setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const filtered = entries.filter((e) => {
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.customers?.name?.toLowerCase().includes(q) ||
      e.customers?.phone?.includes(q) ||
      e.description?.toLowerCase().includes(q)
    );
  });

  const totalPending = entries
    .filter((e) => e.status === 'pending')
    .reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Udhaar Book</h2>
          <p className="text-sm text-gray-500 mt-1">
            Pending: ₹{totalPending.toLocaleString('en-IN')}
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Add
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-4 space-y-3">
          <div>
            <label className="label">Customer *</label>
            <div className="flex gap-2">
              <select
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                className="input-field flex-1"
                required
              >
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.phone ? ` - ${c.phone}` : ''}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowCustomerForm(!showCustomerForm)}
                className="btn-secondary p-2"
              >
                <UserPlus size={16} />
              </button>
            </div>
          </div>

          {showCustomerForm && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-gray-500">New Customer</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="input-field"
                  placeholder="Name *"
                />
                <input
                  type="text"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  className="input-field"
                  placeholder="Phone"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustomer}
                disabled={submitting}
                className="btn-accent text-sm py-1.5"
              >
                Add Customer
              </button>
            </div>
          )}

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
              <label className="label">Due Date</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field"
                placeholder="Medicine name, etc."
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : 'Save Entry'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
            placeholder="Search by name, phone, or description..."
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'pending', 'paid'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterStatus === s
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No udhaar entries found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => {
            const isOverdue = e.status === 'pending' && e.due_date && new Date(e.due_date) < new Date();
            return (
              <div
                key={e.id}
                className={`card flex items-center justify-between group ${
                  isOverdue ? 'border-l-4 border-l-red-400' : ''
                } ${e.status === 'paid' ? 'opacity-60' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">
                      ₹{Number(e.amount).toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        e.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : isOverdue
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {e.status === 'paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{e.customers?.name || 'Unknown'}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    {e.due_date && <span>Due: {new Date(e.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                    {e.description && <span className="truncate">{e.description}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {e.status === 'pending' && (
                    <button onClick={() => markPaid(e.id)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="Mark as paid">
                      <Check size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
