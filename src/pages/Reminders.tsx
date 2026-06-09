import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Check, Phone, MessageSquare } from 'lucide-react';

interface UdhaarWithCustomer {
  id: string;
  customer_id: string;
  amount: number;
  due_date: string | null;
  description: string | null;
  status: 'pending' | 'paid';
  created_at: string;
  customers: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
}

function formatSMS(name: string, amount: number, dueDate: string | null): string {
  const dueStr = dueDate
    ? ` Due date: ${new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`
    : '';
  return `Dear ${name}, your payment of Rs.${amount.toLocaleString('en-IN')} is pending at our medical store.${dueStr} Kindly clear it at your earliest convenience. - PaisaTracker`;
}

export default function Reminders() {
  const [pendingEntries, setPendingEntries] = useState<UdhaarWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  useEffect(() => { loadPending(); }, []);

  async function loadPending() {
    setLoading(true);
    const { data, error } = await supabase
      .from('udhaar_entries')
      .select('*, customers(*)')
      .eq('status', 'pending')
      .order('due_date', { ascending: true, nullsFirst: false });

    if (!error && data) setPendingEntries(data as UdhaarWithCustomer[]);
    setLoading(false);
  }

  function sendSMS(entry: UdhaarWithCustomer) {
    if (!entry.customers?.phone) return;
    const message = formatSMS(entry.customers.name, Number(entry.amount), entry.due_date);
    const phone = entry.customers.phone.replace(/\D/g, '');
    const url = `sms:${phone}?body=${encodeURIComponent(message)}`;
    window.open(url, '_self');
    setSentIds((prev) => new Set(prev).add(entry.id));
  }

  function sendWhatsApp(entry: UdhaarWithCustomer) {
    if (!entry.customers?.phone) return;
    const message = formatSMS(entry.customers.name, Number(entry.amount), entry.due_date);
    let phone = entry.customers.phone.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setSentIds((prev) => new Set(prev).add(entry.id));
  }

  const overdueEntries = pendingEntries.filter(
    (e) => e.due_date && new Date(e.due_date) < new Date()
  );
  const upcomingEntries = pendingEntries.filter(
    (e) => !e.due_date || new Date(e.due_date) >= new Date()
  );

  const totalPending = pendingEntries.reduce((s, e) => s + Number(e.amount), 0);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading reminders...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Payment Reminders</h2>
        <p className="text-sm text-gray-500 mt-1">
          {pendingEntries.length} pending payments totaling Rs.{totalPending.toLocaleString('en-IN')}
        </p>
      </div>

      {pendingEntries.length === 0 ? (
        <div className="text-center py-16">
          <Check size={48} className="mx-auto text-green-300 mb-4" />
          <p className="text-gray-500 font-medium">All payments collected!</p>
          <p className="text-gray-400 text-sm mt-1">No pending udhaar entries to remind.</p>
        </div>
      ) : (
        <>
          {overdueEntries.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide">Overdue</h3>
                <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                  {overdueEntries.length}
                </span>
              </div>
              <div className="space-y-2">
                {overdueEntries.map((e) => (
                  <ReminderCard key={e.id} entry={e} sent={sentIds.has(e.id)} onSMS={sendSMS} onWhatsApp={sendWhatsApp} />
                ))}
              </div>
            </div>
          )}

          {upcomingEntries.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Upcoming</h3>
                <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
                  {upcomingEntries.length}
                </span>
              </div>
              <div className="space-y-2">
                {upcomingEntries.map((e) => (
                  <ReminderCard key={e.id} entry={e} sent={sentIds.has(e.id)} onSMS={sendSMS} onWhatsApp={sendWhatsApp} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ReminderCard({
  entry,
  sent,
  onSMS,
  onWhatsApp,
}: {
  entry: UdhaarWithCustomer;
  sent: boolean;
  onSMS: (e: UdhaarWithCustomer) => void;
  onWhatsApp: (e: UdhaarWithCustomer) => void;
}) {
  const hasPhone = !!entry.customers?.phone;
  const isOverdue = entry.due_date && new Date(entry.due_date) < new Date();

  return (
    <div className={`card ${isOverdue ? 'border-l-4 border-l-red-400' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">
              Rs.{Number(entry.amount).toLocaleString('en-IN')}
            </span>
            {isOverdue && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                Overdue
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{entry.customers?.name || 'Unknown'}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            {entry.due_date && (
              <span>
                Due: {new Date(entry.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            )}
            {entry.description && <span>{entry.description}</span>}
          </div>
        </div>
      </div>

      {hasPhone && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Phone size={12} />
            {entry.customers!.phone}
          </span>
          <div className="flex-1" />
          <button
            onClick={() => onSMS(entry)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sent ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <MessageSquare size={12} />
            {sent ? 'Sent' : 'SMS'}
          </button>
          <button
            onClick={() => onWhatsApp(entry)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-all"
          >
            <Send size={12} />
            WhatsApp
          </button>
        </div>
      )}

      {!hasPhone && (
        <p className="text-xs text-red-400 mt-2 pt-2 border-t border-gray-100">
          No phone number - add one in Udhaar Book
        </p>
      )}
    </div>
  );
}
