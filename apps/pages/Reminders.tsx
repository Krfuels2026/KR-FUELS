import React, { useState, useMemo } from 'react';
import { Reminder } from '../types';
import { Plus, Trash2, Edit2, X, Bell, Calendar, AlertCircle } from 'lucide-react';
import { useReminders, useCreateReminder, useUpdateReminder, useDeleteReminder } from '../convex-api';

const Reminders: React.FC = () => {
  const convexReminders = useReminders();
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Reminder | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const reminders: Reminder[] = (convexReminders ?? []).map((r: any) => ({
    id: r._id,
    title: r.title,
    description: r.description,
    reminderDate: r.reminderDate,
    dueDate: r.dueDate,
    createdAt: r.createdAt,
    createdBy: r.createdBy,
  }));

  const stats = useMemo(() => ({
    totalReminders: reminders.length,
    activeReminders: reminders.filter(r => r.reminderDate <= today && r.dueDate >= today).length,
    upcomingReminders: reminders.filter(r => r.reminderDate > today).length,
  }), [reminders, today]);

  const onAddReminder = async (r: Partial<Reminder>) => {
    await createReminder({
      title: r.title || 'Untitled',
      description: r.description || '',
      reminderDate: r.reminderDate || today,
      dueDate: r.dueDate || today,
    });
  };

  const onUpdateReminder = async (r: Reminder) => {
    await updateReminder({
      id: r.id as any,
      title: r.title,
      description: r.description || '',
      reminderDate: r.reminderDate,
      dueDate: r.dueDate,
    });
  };

  const onDeleteReminder = async (id: string) => {
    await deleteReminder({ id: id as any });
  };

  const handleAdd = () => {
    if (!title || !reminderDate || !dueDate) { alert('Please provide title, reminder date and due date'); return; }
    onAddReminder({ title, description: desc, reminderDate, dueDate });
    setTitle(''); setDesc(''); setReminderDate(''); setDueDate(''); setOpen(false);
  };

  const openEdit = (r: Reminder) => {
    setEditing(r);
    setIsEditOpen(true);
    setTitle(r.title); setDesc(r.description || ''); setReminderDate(r.reminderDate); setDueDate(r.dueDate);
  };

  const handleUpdate = () => {
    if (!editing) return;
    if (!title || !reminderDate || !dueDate) { alert('Please provide title, reminder date and due date'); return; }
    onUpdateReminder({ ...editing, title, description: desc, reminderDate, dueDate });
    setIsEditOpen(false); setEditing(null); setTitle(''); setDesc(''); setReminderDate(''); setDueDate('');
  };

  const requestDelete = (r: Reminder) => setDeleteTarget(r);

  const confirmDelete = () => {
    if (deleteTarget) onDeleteReminder(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (convexReminders === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto pb-10 h-full flex flex-col">
      <div className="sticky top-0 bg-[#f8fafc] z-20 space-y-4 pt-2 pb-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h1 className="text-[18px] font-black text-slate-900 tracking-tight uppercase">Reminders</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setOpen(true)} 
              className="px-6 py-2 bg-brand text-white rounded-xl font-bold text-[10px] flex items-center gap-2 hover:bg-brand-hover transition-all uppercase tracking-widest active:scale-95 shadow-lg shadow-emerald-500/10"
            >
              <Plus size={14} strokeWidth={3} /> Add Reminder
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-blue-200 transition-colors">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm transition-all group-hover:bg-blue-600 group-hover:text-white">
            <Bell size={18} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em] opacity-80 mb-0.5">Total Reminders</p>
            <p className="text-xl font-bold text-[#0f172a] leading-none tabular-nums">{stats.totalReminders}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-amber-200 transition-colors">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100 shadow-sm transition-all group-hover:bg-amber-600 group-hover:text-white">
            <AlertCircle size={18} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em] opacity-80 mb-0.5">Active Now</p>
            <p className="text-xl font-bold text-[#0f172a] leading-none tabular-nums">{stats.activeReminders}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm">
            <Calendar size={18} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em] opacity-80 mb-0.5">Upcoming</p>
            <p className="text-xl font-bold text-[#0f172a] leading-none tabular-nums">{stats.upcomingReminders}</p>
          </div>
        </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Title</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Description</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Reminder Date</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Due Date</th>
                <th className="px-8 py-4 w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
            {reminders.length === 0 && (
              <tr><td colSpan={5} className="py-12 text-center text-[12px] text-slate-400 uppercase tracking-widest">No reminders added yet.</td></tr>
            )}
            {reminders.map(r => (
              <tr key={r.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-4 text-[14px] font-black text-slate-800 uppercase tracking-tight">{r.title}</td>
                <td className="px-8 py-4 text-[14px] font-medium text-slate-600">{r.description}</td>
                <td className="px-8 py-4 text-[14px] font-medium text-slate-600 tabular-nums">{r.reminderDate}</td>
                <td className="px-8 py-4 text-[14px] font-medium text-slate-600 tabular-nums">{r.dueDate}</td>
                <td className="px-8 py-4 text-center">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => openEdit(r)} 
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Edit Reminder"
                      aria-label="Edit"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button 
                      onClick={() => requestDelete(r)} 
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Reminder"
                      aria-label="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-brand text-white rounded-lg flex items-center justify-center shadow-md">
                  <Bell size={16} />
                </div>
                <h2 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest">Add Reminder</h2>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-all">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">Title</label>
                <input 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required
                  placeholder="Enter reminder title..."
                  className="w-full px-4 bg-slate-50 border border-slate-200 rounded-lg font-bold text-[14px] text-slate-900 focus:border-brand focus:bg-white transition-all outline-none h-[44px] placeholder:text-slate-400 placeholder:text-[11px] placeholder:normal-case shadow-inner" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">Description</label>
                <textarea 
                  value={desc} 
                  onChange={e => setDesc(e.target.value)} 
                  placeholder="Enter description..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:border-brand focus:bg-white transition-all outline-none placeholder:text-slate-400 placeholder:text-[11px] shadow-inner" 
                  rows={3} 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">Reminder Date</label>
                  <input 
                    type="date" 
                    value={reminderDate} 
                    onChange={e => setReminderDate(e.target.value)} 
                    required
                    className="w-full px-4 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:border-brand focus:bg-white transition-all outline-none h-[44px] shadow-inner" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">Due Date</label>
                  <input 
                    type="date" 
                    value={dueDate} 
                    onChange={e => setDueDate(e.target.value)} 
                    required
                    className="w-full px-4 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:border-brand focus:bg-white transition-all outline-none h-[44px] shadow-inner" 
                  />
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-brand text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-brand-hover transition-all shadow-lg shadow-emerald-500/10"
                >
                  Add Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditOpen && editing && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setIsEditOpen(false); setEditing(null); }} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center shadow-md">
                  <Edit2 size={16} />
                </div>
                <h2 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest">Edit Reminder</h2>
              </div>
              <button onClick={() => { setIsEditOpen(false); setEditing(null); }} className="p-1.5 text-slate-400 hover:text-rose-500 transition-all">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">Title</label>
                <input 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required
                  placeholder="Enter reminder title..."
                  className="w-full px-4 bg-slate-50 border border-slate-200 rounded-lg font-bold text-[14px] text-slate-900 focus:border-brand focus:bg-white transition-all outline-none h-[44px] placeholder:text-slate-400 placeholder:text-[11px] placeholder:normal-case shadow-inner" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">Description</label>
                <textarea 
                  value={desc} 
                  onChange={e => setDesc(e.target.value)} 
                  placeholder="Enter description..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:border-brand focus:bg-white transition-all outline-none placeholder:text-slate-400 placeholder:text-[11px] shadow-inner" 
                  rows={3} 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">Reminder Date</label>
                  <input 
                    type="date" 
                    value={reminderDate} 
                    onChange={e => setReminderDate(e.target.value)} 
                    required
                    className="w-full px-4 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:border-brand focus:bg-white transition-all outline-none h-[44px] shadow-inner" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest px-0.5">Due Date</label>
                  <input 
                    type="date" 
                    value={dueDate} 
                    onChange={e => setDueDate(e.target.value)} 
                    required
                    className="w-full px-4 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:border-brand focus:bg-white transition-all outline-none h-[44px] shadow-inner" 
                  />
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => { setIsEditOpen(false); setEditing(null); }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-brand text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-brand-hover transition-all shadow-lg shadow-emerald-500/10"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center shadow-md">
                  <Trash2 size={16} />
                </div>
                <h2 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest">Confirm Delete</h2>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-[13px] text-slate-600">Are you sure you want to delete the reminder <strong className="font-bold text-slate-900">{deleteTarget.title}</strong>? This action cannot be undone.</p>
              <div className="flex items-center gap-3 mt-6">
                <button 
                  onClick={() => setDeleteTarget(null)} 
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/10"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
