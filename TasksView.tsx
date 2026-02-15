
import React, { useState, useMemo } from 'react';
import { Plus, ListTodo, CheckCircle2, Trash2, Calendar, Clock, BellRing, AlertTriangle } from 'lucide-react';
import { Task } from './types';
import { Badge } from './Badge';

interface TasksViewProps {
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const TasksView = ({ tasks, setTasks, notify }: TasksViewProps) => {
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newPriority, setNewPriority] = useState<'Haute'|'Moyenne'|'Basse'>('Moyenne');

  const addTask = () => {
    if (!newTitle || !newDate || !newTime) {
      notify("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }
    const dateObj = new Date(newDate);
    const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(dateObj);
    const newTask: Task = {
      id: `TASK-${Date.now()}`,
      title: newTitle,
      date: newDate,
      time: newTime,
      day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      priority: newPriority,
      status: 'En attente',
      isAlerted: false
    };
    setTasks([newTask, ...tasks]);
    setNewTitle(''); setNewDate(''); setNewTime('');
    notify(`Tâche "${newTask.title}" ajoutée à votre agenda.`);
  };

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    const newStatus = task?.status === 'Terminée' ? 'En attente' : 'Terminée';
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    notify(`Tâche "${task?.title}" marquée comme ${newStatus.toLowerCase()}.`);
  };

  const deleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (window.confirm(`SUPPRESSION TÂCHE : Souhaitez-vous retirer définitivement "${task?.title}" de votre agenda logistique ?`)) {
      setTasks(tasks.filter(t => t.id !== id));
      notify(`Tâche "${task?.title}" retirée de la liste.`, "error");
    }
  };

  const isOverdue = (task: Task) => {
    if (task.status === 'Terminée') return false;
    const taskDate = new Date(`${task.date}T${task.time}`);
    return taskDate < new Date();
  };

  const isToday = (task: Task) => {
    const today = new Date().toISOString().split('T')[0];
    return task.date === today;
  };

  return (
    <div className="space-y-10 animate-fade-in pb-32">
       <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-xl font-header italic uppercase mb-8 flex items-center gap-3"><Plus className="w-5 h-5 text-emerald-500" /> Planifier une nouvelle tâche</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
             <div className="lg:col-span-2 space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Description de la tâche</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: Inventaire de fin de mois..." className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[11px] font-black uppercase italic outline-none focus:ring-2 focus:ring-[#1a3a22]" />
             </div>
             <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Date</label>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]" />
             </div>
             <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Heure</label>
                <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-[#1a3a22]" />
             </div>
             <div className="flex items-end">
                <button onClick={addTask} className="w-full bg-[#1a3a22] text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-800 transition-all">Ajouter</button>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 gap-4">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-6 mb-2">Liste des engagements</h3>
          {tasks.length === 0 ? (
            <div className="text-center py-20 opacity-20"><ListTodo className="w-20 h-20 mx-auto mb-4" /><p className="text-[12px] font-black uppercase italic">Aucune tâche planifiée</p></div>
          ) : (
            tasks.map((task) => {
              const overdue = isOverdue(task);
              const today = isToday(task);
              return (
                <div key={task.id} className={`bg-white p-6 rounded-[2.5rem] border transition-all flex items-center justify-between shadow-sm ${task.status === 'Terminée' ? 'opacity-50' : overdue ? 'border-rose-200 bg-rose-50/20' : 'border-slate-100'}`}>
                   <div className="flex items-center gap-6">
                      <button onClick={() => toggleTask(task.id)} className={`p-3 rounded-2xl shadow-sm ${task.status === 'Terminée' ? 'bg-emerald-500 text-white' : overdue ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-300'}`}><CheckCircle2 className="w-6 h-6" /></button>
                      <div>
                         <div className="flex items-center gap-3">
                            <h4 className={`text-[15px] font-black uppercase italic ${task.status === 'Terminée' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{task.title}</h4>
                            <Badge variant={task.priority === 'Haute' ? 'danger' : 'warning'}>{task.priority}</Badge>
                         </div>
                         <p className="text-slate-400 text-[10px] font-bold uppercase mt-2">{task.day} {new Date(task.date).toLocaleDateString()} à {task.time}</p>
                      </div>
                   </div>
                   <button onClick={() => deleteTask(task.id)} className="p-3 bg-rose-50 text-rose-300 hover:text-rose-500 rounded-2xl transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })
          )}
       </div>
    </div>
  );
};
