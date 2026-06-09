import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Package, Search, FileText, Check } from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  batch_no: string | null;
  quantity: number;
  mrp: number;
  purchase_price: number;
  expiry_date: string | null;
  supplier_name: string | null;
  created_at: string;
}

interface SupplierBill {
  id: string;
  supplier_name: string;
  bill_number: string | null;
  amount: number;
  due_date: string | null;
  status: 'unpaid' | 'paid';
  paid_at: string | null;
  created_at: string;
}

type Tab = 'stock' | 'bills';

export default function MedicineStock() {
  const [tab, setTab] = useState<Tab>('stock');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [bills, setBills] = useState<SupplierBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [showBillForm, setShowBillForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [medForm, setMedForm] = useState({
    name: '', batch_no: '', quantity: '', mrp: '', purchase_price: '',
    expiry_date: '', supplier_name: '',
  });
  const [billForm, setBillForm] = useState({
    supplier_name: '', bill_number: '', amount: '', due_date: '',
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [medRes, billRes] = await Promise.all([
      supabase.from('medicine_stock').select('*').order('name'),
      supabase.from('supplier_bills').select('*').order('created_at', { ascending: false }),
    ]);
    if (!medRes.error && medRes.data) setMedicines(medRes.data);
    if (!billRes.error && billRes.data) setBills(billRes.data);
    setLoading(false);
  }

  async function handleAddMedicine(e: React.FormEvent) {
    e.preventDefault();
    if (!medForm.name || !medForm.quantity) return;
    setSubmitting(true);
    const { error } = await supabase.from('medicine_stock').insert({
      name: medForm.name,
      batch_no: medForm.batch_no || null,
      quantity: parseInt(medForm.quantity),
      mrp: parseFloat(medForm.mrp) || 0,
      purchase_price: parseFloat(medForm.purchase_price) || 0,
      expiry_date: medForm.expiry_date || null,
      supplier_name: medForm.supplier_name || null,
    });
    if (!error) {
      setMedForm({ name: '', batch_no: '', quantity: '', mrp: '', purchase_price: '', expiry_date: '', supplier_name: '' });
      setShowMedicineForm(false);
      loadData();
    }
    setSubmitting(false);
  }

  async function handleAddBill(e: React.FormEvent) {
    e.preventDefault();
    if (!billForm.supplier_name || !billForm.amount) return;
    setSubmitting(true);
    const { error } = await supabase.from('supplier_bills').insert({
      supplier_name: billForm.supplier_name,
      bill_number: billForm.bill_number || null,
      amount: parseFloat(billForm.amount),
      due_date: billForm.due_date || null,
      status: 'unpaid',
    });
    if (!error) {
      setBillForm({ supplier_name: '', bill_number: '', amount: '', due_date: '' });
      setShowBillForm(false);
      loadData();
    }
    setSubmitting(false);
  }

  async function markBillPaid(id: string) {
    const { error } = await supabase
      .from('supplier_bills')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) loadData();
  }

  async function deleteMedicine(id: string) {
    const { error } = await supabase.from('medicine_stock').delete().eq('id', id);
    if (!error) setMedicines((prev) => prev.filter((m) => m.id !== id));
  }

  async function deleteBill(id: string) {
    const { error } = await supabase.from('supplier_bills').delete().eq('id', id);
    if (!error) setBills((prev) => prev.filter((b) => b.id !== id));
  }

  const filteredMeds = medicines.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || (m.supplier_name?.toLowerCase().includes(q)) || (m.batch_no?.toLowerCase().includes(q));
  });

  const filteredBills = bills.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return b.supplier_name.toLowerCase().includes(q) || (b.bill_number?.toLowerCase().includes(q));
  });

  const totalUnpaid = bills.filter((b) => b.status === 'unpaid').reduce((s, b) => s + Number(b.amount), 0);

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Stock & Bills</h2>
        <button
          onClick={() => tab === 'stock' ? setShowMedicineForm(!showMedicineForm) : setShowBillForm(!showBillForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          {tab === 'stock' ? 'Medicine' : 'Bill'}
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
        <button
          onClick={() => setTab('stock')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'stock' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Package size={14} />
          Stock ({medicines.length})
        </button>
        <button
          onClick={() => setTab('bills')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'bills' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          <FileText size={14} />
          Bills ({bills.filter((b) => b.status === 'unpaid').length} unpaid)
        </button>
      </div>

      {tab === 'bills' && (
        <div className="card mb-4 bg-amber-50 border-amber-200">
          <p className="text-sm font-semibold text-amber-800">Total Unpaid: ₹{totalUnpaid.toLocaleString('en-IN')}</p>
        </div>
      )}

      {tab === 'stock' && showMedicineForm && (
        <form onSubmit={handleAddMedicine} className="card mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Medicine Name *</label>
              <input type="text" value={medForm.name} onChange={(e) => setMedForm({ ...medForm, name: e.target.value })} className="input-field" placeholder="Paracetamol 500mg" required />
            </div>
            <div>
              <label className="label">Batch No</label>
              <input type="text" value={medForm.batch_no} onChange={(e) => setMedForm({ ...medForm, batch_no: e.target.value })} className="input-field" placeholder="B2024-01" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Quantity *</label>
              <input type="number" value={medForm.quantity} onChange={(e) => setMedForm({ ...medForm, quantity: e.target.value })} className="input-field" placeholder="0" required />
            </div>
            <div>
              <label className="label">MRP (₹)</label>
              <input type="number" step="0.01" value={medForm.mrp} onChange={(e) => setMedForm({ ...medForm, mrp: e.target.value })} className="input-field" placeholder="0.00" />
            </div>
            <div>
              <label className="label">Purchase (₹)</label>
              <input type="number" step="0.01" value={medForm.purchase_price} onChange={(e) => setMedForm({ ...medForm, purchase_price: e.target.value })} className="input-field" placeholder="0.00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Expiry Date</label>
              <input type="date" value={medForm.expiry_date} onChange={(e) => setMedForm({ ...medForm, expiry_date: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Supplier</label>
              <input type="text" value={medForm.supplier_name} onChange={(e) => setMedForm({ ...medForm, supplier_name: e.target.value })} className="input-field" placeholder="Supplier name" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : 'Add Medicine'}</button>
            <button type="button" onClick={() => setShowMedicineForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {tab === 'bills' && showBillForm && (
        <form onSubmit={handleAddBill} className="card mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Supplier Name *</label>
              <input type="text" value={billForm.supplier_name} onChange={(e) => setBillForm({ ...billForm, supplier_name: e.target.value })} className="input-field" placeholder="Supplier name" required />
            </div>
            <div>
              <label className="label">Bill Number</label>
              <input type="text" value={billForm.bill_number} onChange={(e) => setBillForm({ ...billForm, bill_number: e.target.value })} className="input-field" placeholder="INV-001" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹) *</label>
              <input type="number" step="0.01" value={billForm.amount} onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })} className="input-field" placeholder="0.00" required />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" value={billForm.due_date} onChange={(e) => setBillForm({ ...billForm, due_date: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : 'Add Bill'}</button>
            <button type="button" onClick={() => setShowBillForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" placeholder="Search medicines, suppliers, bills..." />
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading...</div>
      ) : tab === 'stock' ? (
        filteredMeds.length === 0 ? (
          <div className="text-center py-12">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No medicines in stock</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMeds.map((m) => {
              const isExpiring = m.expiry_date && new Date(m.expiry_date) < new Date(Date.now() + 90 * 86400000);
              const isLow = m.quantity < 10;
              return (
                <div key={m.id} className={`card flex items-center justify-between group ${isLow ? 'border-l-4 border-l-orange-400' : ''} ${isExpiring ? 'border-l-4 border-l-red-400' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{m.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isLow ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'}`}>
                        {m.quantity} units
                      </span>
                      {isExpiring && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                          Exp: {new Date(m.expiry_date!).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {m.batch_no && <span>Batch: {m.batch_no}</span>}
                      {m.mrp > 0 && <span>MRP: ₹{Number(m.mrp).toLocaleString('en-IN')}</span>}
                      {m.purchase_price > 0 && <span>Purchase: ₹{Number(m.purchase_price).toLocaleString('en-IN')}</span>}
                      {m.supplier_name && <span>{m.supplier_name}</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteMedicine(m.id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )
      ) : filteredBills.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No supplier bills</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredBills.map((b) => {
            const isOverdue = b.status === 'unpaid' && b.due_date && new Date(b.due_date) < new Date();
            return (
              <div key={b.id} className={`card flex items-center justify-between group ${isOverdue ? 'border-l-4 border-l-red-400' : ''} ${b.status === 'paid' ? 'opacity-60' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">₹{Number(b.amount).toLocaleString('en-IN')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.status === 'paid' ? 'bg-green-100 text-green-700' : isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {b.status === 'paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Unpaid'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{b.supplier_name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {b.bill_number && <span>Bill: {b.bill_number}</span>}
                    {b.due_date && <span>Due: {new Date(b.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {b.status === 'unpaid' && (
                    <button onClick={() => markBillPaid(b.id)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="Mark as paid">
                      <Check size={18} />
                    </button>
                  )}
                  <button onClick={() => deleteBill(b.id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all">
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
