
import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { DEFAULT_AVATAR } from '../constants';
import { supabase } from '../services/supabase';

const pad2 = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const minutesToLabel = (mins: number) => {
  const rounded = Math.round(mins);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const typeMeta = (t: string | null | undefined) => {
  const type = (t ?? "").toLowerCase();
  switch (type) {
    case "clock-in":
      return { label: "Entrada trabajo", icon: "login", color: "primary" as const };
    case "clock-out":
      return { label: "Salida trabajo", icon: "logout", color: "slate" as const };
    case "break-start":
      return { label: "Inicio descanso", icon: "coffee", color: "amber" as const };
    case "break-end":
      return { label: "Fin descanso", icon: "play_arrow", color: "emerald" as const };
    case "others-in":
      return { label: "Fin Permiso", icon: "history_edu", color: "pink" as const };
    case "others-out":
      return { label: "Permiso", icon: "edit_note", color: "pink" as const };
    default:
      return { label: "Registro", icon: "schedule", color: "primary" as const };
  }
};

const colorClasses = (c: "primary" | "slate" | "amber" | "emerald" | "pink") => {
  switch (c) {
    case "slate": return { border: "border-slate-500", iconBg: "bg-slate-500/10", iconText: "text-slate-500" };
    case "amber": return { border: "border-amber-500", iconBg: "bg-amber-500/10", iconText: "text-amber-500" };
    case "emerald": return { border: "border-emerald-500", iconBg: "bg-emerald-500/10", iconText: "text-emerald-500" };
    case "pink": return { border: "border-pink-500", iconBg: "bg-pink-500/10", iconText: "text-pink-500" };
    case "primary": default: return { border: "border-primary", iconBg: "bg-primary/10", iconText: "text-primary" };
  }
};

const HistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const [entryType, setEntryType] = useState<'clock-in' | 'clock-out' | 'break-start' | 'break-end' | 'others-in' | 'others-out'>('clock-in');
  const [context, setContext] = useState('');
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form states
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [formDate, setFormDate] = useState(isoDate(new Date()));
  const [formTime, setFormTime] = useState('08:00');
  const [formTimeEnd, setFormTimeEnd] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setLoadingHistory(true);
      const dateStr = isoDate(selectedDate);
      
      // Rango del día seleccionado
      const start = `${dateStr}T00:00:00`;
      const end = `${dateStr}T23:59:59`;

      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('occurred_at', start)
        .lte('occurred_at', end)
        .order('occurred_at', { ascending: false });

      if (!error && data) {
         setHistoryEntries(data);
      } else {
         setHistoryEntries([]);
      }
      setLoadingHistory(false);
    };

    fetchHistory();
    fetchHistory();
  }, [selectedDate, user, refreshKey]);

  const handleRefresh = () => setRefreshKey(k => k + 1);

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que quieres eliminar este registro?")) return;
    
    const { error } = await supabase.from('time_entries').delete().eq('id', id);
    if (error) {
       console.error(error);
       alert("Error al eliminar");
    } else {
       handleRefresh();
    }
  };

  const openAddModal = () => {
    setEditingEntry(null);
    setEntryType('clock-in');
    setContext('');
    setFormDate(isoDate(selectedDate)); // Default to selected date
    const now = new Date();
    setFormTime(`${pad2(now.getHours())}:${pad2(now.getMinutes())}`);
    setFormTimeEnd('');
    setShowModal(true);
  };

  const openEditModal = (entry: any) => {
    setEditingEntry(entry);
    setEntryType(entry.entry_type);
    setContext(entry.description || ''); // Simple context mapping
    
    const d = entry.occurred_at ? new Date(entry.occurred_at) : new Date(entry.created_at);
    setFormDate(isoDate(d));
    setFormTime(`${pad2(d.getHours())}:${pad2(d.getMinutes())}`);
    setFormTimeEnd('');
    
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Helper to construct Date
    const makeDate = (dateStr: string, timeStr: string) => {
       const [y, m, d] = dateStr.split('-').map(Number);
       const [hh, mm] = timeStr.split(':').map(Number);
       return new Date(y, m - 1, d, hh, mm);
    };

    const isIntervalBreak = !editingEntry && (entryType as any) === 'break-interval';
    const isIntervalOthers = !editingEntry && (entryType as any) === 'others-interval';

    let error = null;

    if (isIntervalBreak || isIntervalOthers) {
       // INTERVAL SAVE (2 records)
       if (!formTimeEnd) {
          alert("Debes indicar hora de inicio y fin");
          return;
       }
       const startAt = makeDate(formDate, formTime);
       const endAt = makeDate(formDate, formTimeEnd);

       if (endAt <= startAt) {
          alert("La hora de fin debe ser posterior al inicio");
          return;
       }

       const typeStart = isIntervalBreak ? 'break-start' : 'others-out';
       const typeEnd = isIntervalBreak ? 'break-end' : 'others-in';
       
       const desc = isIntervalOthers ? context : typeMeta(typeStart).label;

       // 1. Insert Start
       const { error: err1 } = await supabase.from('time_entries').insert({
          user_id: user.id,
          entry_type: typeStart,
          description: desc,
          occurred_at: startAt.toISOString(),
          date: formDate,
          entry_time: formTime
       });
       if (err1) error = err1;
       else {
          // 2. Insert End
          const { error: err2 } = await supabase.from('time_entries').insert({
            user_id: user.id,
            entry_type: typeEnd,
            description: isIntervalOthers ? "Fin Permiso" : typeMeta(typeEnd).label, // Usually end has generic desc
            occurred_at: endAt.toISOString(),
            date: formDate,
            entry_time: formTimeEnd
         });
         error = err2;
       }

    } else {
      // SINGLE SAVE (Insert or Update)
      const occurredAt = makeDate(formDate, formTime);
      
      const payload = {
        user_id: user.id,
        entry_type: entryType,
        description: (entryType === 'others-in' || entryType === 'others-out') ? context : (typeMeta(entryType).label),
        occurred_at: occurredAt.toISOString(),
        date: formDate, // Legacy/Redundant
        entry_time: formTime, // Legacy
      };

      if (editingEntry) {
        // Update
        const { error: err } = await supabase
          .from('time_entries')
          .update(payload)
          .eq('id', editingEntry.id);
        error = err;
      } else {
        // Insert
        const { error: err } = await supabase
          .from('time_entries')
          .insert(payload);
        error = err;
      }
    }

    if (error) {
      console.error(error);
      alert("Error al guardar");
    } else {
      setShowModal(false);
      setContext('');
      setEditingEntry(null);
      handleRefresh();
    }
  };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const daysOfWeek = ["L", "M", "X", "J", "V", "S", "D"];

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: null, currentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, currentMonth: true });
    }
    return days;
  }, [currentDate]);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === currentDate.getMonth() && 
           today.getFullYear() === currentDate.getFullYear();
  };

  const isPastDay = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return dateToCheck < today;
  };

  const isSelected = (day: number) => {
    return selectedDate.getDate() === day && 
           selectedDate.getMonth() === currentDate.getMonth() && 
           selectedDate.getFullYear() === currentDate.getFullYear();
  };

  const dailyDistribution = useMemo(() => {
    // 1. Sort ascending
    const sorted = [...historyEntries].sort((a, b) => {
      const da = a.occurred_at ? new Date(a.occurred_at) : new Date(a.created_at);
      const db = b.occurred_at ? new Date(b.occurred_at) : new Date(b.created_at);
      return da.getTime() - db.getTime();
    });

    let w = 0, b = 0, o = 0;
    
    // We want to calculate intervals.
    // Start of calculation: 00:00 of selectedDate
    let lastTime = new Date(selectedDate);
    lastTime.setHours(0,0,0,0);
    
    let lastState = 'out'; // Assumed start state

    const mapTypeToState = (t: string) => {
      t = (t || '').toLowerCase();
      if (t === 'clock-in') return 'working';
      if (t === 'break-start') return 'break';
      if (t === 'break-end') return 'working';
      if (t === 'others-out') return 'others';
      if (t === 'others-in') return 'working';
      if (t === 'clock-out') return 'out';
      return 'out';
    };

    // Calculate duration for each interval
    sorted.forEach(e => {
        const time = e.occurred_at ? new Date(e.occurred_at) : new Date(e.created_at);
        // Clamp time to selectedDate (just in case)
        
        const diffMins = (time.getTime() - lastTime.getTime()) / 1000 / 60;
        if (diffMins > 0) {
           if (lastState === 'working') w += diffMins;
           else if (lastState === 'break') b += diffMins;
           else if (lastState === 'others') o += diffMins;
        }
        
        lastTime = time;
        lastState = mapTypeToState(e.entry_type);
    });

    // Final interval: from last event to Now (if today) or 23:59:59 (if past)
    const isSelToday = 
      selectedDate.getDate() === new Date().getDate() &&
      selectedDate.getMonth() === new Date().getMonth() &&
      selectedDate.getFullYear() === new Date().getFullYear();

    let endTime = new Date(selectedDate);
    if (isSelToday) {
       endTime = new Date(); // now
    } else {
       endTime.setHours(23, 59, 59, 999);
    }

    if (lastTime < endTime) {
       const diff = (endTime.getTime() - lastTime.getTime()) / 1000 / 60;
       if (diff > 0) {
           if (lastState === 'working') w += diff;
           else if (lastState === 'break') b += diff;
           else if (lastState === 'others') o += diff;
       }
    }

    const totalDay = 1440; // 24h * 60m
    const trackedStats = w + b + o;
    // Free is whatever is left of the day (including "out" time)
    // For "Today", should we count future time as free? 
    // Usually "Libre" implies "Not Working/Break/Others" in the 24h cycle?
    // Or just "Time passed while Out"?
    // The previous mockup had "Libre" + others summing to ~12h? 
    // Let's assume Libre = 24h - (Work+Break+Permission).
    const f = Math.max(0, totalDay - trackedStats);

    const p = (val: number) => Math.round((val / totalDay) * 100);

    return [
      { label: 'Trabajando', hours: minutesToLabel(w), value: p(w), color: '#135bec' },
      { label: 'Descansando', hours: minutesToLabel(b), value: p(b), color: '#f59e0b' },
      { label: 'Permiso', hours: minutesToLabel(o), value: p(o), color: '#ec4899' },
      { label: 'Libre', hours: minutesToLabel(f), value: p(f), color: '#475569' },
    ];
  }, [historyEntries, selectedDate]);

  const renderMiniDonut = () => {
    let cumulativePercent = 0;
    const size = 80;
    const center = size / 2;
    const radius = 30;
    const strokeWidth = 10;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 drop-shadow-sm shrink-0">
        {dailyDistribution.map((item, index) => {
          const startPercent = cumulativePercent;
          const endPercent = cumulativePercent + item.value;
          cumulativePercent = endPercent;
          const startAngle = (startPercent / 100) * 2 * Math.PI;
          const endAngle = (endPercent / 100) * 2 * Math.PI;
          const x1 = center + radius * Math.cos(startAngle);
          const y1 = center + radius * Math.sin(startAngle);
          const x2 = center + radius * Math.cos(endAngle);
          const y2 = center + radius * Math.sin(endAngle);
          const largeArcFlag = item.value > 50 ? 1 : 0;
          const pathData = [`M ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`].join(' ');
          return (
            <path
              key={index}
              d={pathData}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    );
  };

  const [isEditingHistory, setIsEditingHistory] = useState(false);

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto shadow-xl bg-background-light dark:bg-background-dark pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background-light dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-gray-900 dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-none bg-transparent cursor-pointer">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-tight">Historial</h2>
          <div 
            onClick={() => navigate('/profile')} 
            className="bg-center bg-no-repeat bg-cover rounded-full size-10 shadow-sm border-2 border-primary/20 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all" 
            style={{backgroundImage: `url("${user.user_metadata?.avatar_url || DEFAULT_AVATAR}")`}}
          ></div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 flex flex-col gap-6">
        {/* Calendar Controller */}
        {/* Calendar Controller */}
        <div className="flex items-center justify-between px-2 bg-white dark:bg-surface-dark py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/50">
          <button onClick={prevMonth} className="p-1 rounded-lg text-gray-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-none bg-transparent cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <div className="flex flex-col items-center">
            <span className="text-gray-900 dark:text-white font-bold text-base tracking-tight">
              {monthNames[currentDate.getMonth()]}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              {currentDate.getFullYear()}
            </span>
          </div>
          <button onClick={nextMonth} className="p-1 rounded-lg text-gray-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-none bg-transparent cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800/50">
          <div className="grid grid-cols-7 gap-1 mb-4">
            {daysOfWeek.map((day, idx) => (
              <div key={idx} className="h-8 flex items-center justify-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{day}</span>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {calendarData.map((item, idx) => {
              if (!item.day) return <div key={idx} className="aspect-square"></div>;
              
              const activeToday = isToday(item.day);
              const activeSelected = isSelected(item.day);
              const hasHistory = isPastDay(item.day);
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), item.day!))}
                  className={`
                    relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border-none cursor-pointer
                    ${activeSelected ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105 z-10' : 'bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                    ${activeToday && !activeSelected ? 'ring-2 ring-primary ring-inset' : ''}
                  `}
                >
                  <span className={`text-sm font-bold ${activeSelected ? 'text-white' : ''}`}>
                    {item.day}
                  </span>
                  {hasHistory && !activeSelected && (
                    <div className="absolute bottom-2 w-1 h-1 rounded-full bg-primary/40"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details Section */}
        <div className="flex flex-col gap-5">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            Detalle: {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}
          </h3>
          
          <div className="bg-white dark:bg-surface-dark rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800/50">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Distribución del Tiempo</h4>
            <div className="flex items-center gap-6">
              {renderMiniDonut()}
              <div className="flex flex-col gap-2.5 flex-1">
                {dailyDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.hours}</span>
                      <span className="text-[9px] font-light text-slate-400 dark:text-slate-500">{item.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Registros de Actividad</h4>
              <button 
                onClick={() => setIsEditingHistory(!isEditingHistory)}
                className={`text-xs font-bold transition-colors cursor-pointer border-none bg-transparent ${isEditingHistory ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {isEditingHistory ? 'Terminar' : 'Editar'}
              </button>
            </div>

            
            {historyEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-600">
                <span className="material-symbols-outlined text-4xl mb-2">history_toggle_off</span>
                <p className="text-sm font-medium">No hay actividad este día</p>
              </div>
            ) : (
              historyEntries.map((e, idx) => {
                const meta = typeMeta(e.entry_type);
                const c = colorClasses(meta.color);
                
                const occurred = e.occurred_at ? new Date(e.occurred_at) : new Date(e.created_at);
                const timeCell = occurred.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                // Duración
                let durationLabel = null;
                const type = (e.entry_type ?? "").toLowerCase();
                
                 if (
                  type === "clock-in" ||
                  type === "break-start" ||
                  type === "clock-out" ||
                  type === "others-out"
                ) {
                  const msCurrent = occurred.getTime();
                  const parsedNext = idx > 0 ? historyEntries[idx - 1] : null;
                  let msNext = new Date().getTime(); // Default to now if latest
                  
                  // Si no es hoy, y es el último registro, quizás deberíamos cerrar el día o no mostrar tiempo?
                  // Por simplicidad, si es el último del día mostrado (el más reciente) y es el día actual, usamos "ahora".
                  // Si es un día pasado, usamos fin del día o siguiente entrada.
                  // Simplificación: Usamos logica dashboard
                  
                  if (parsedNext) {
                     msNext = parsedNext.occurred_at
                      ? new Date(parsedNext.occurred_at).getTime()
                      : new Date(parsedNext.created_at).getTime();
                  } else if (!isToday(selectedDate.getDate())) {
                      // Si es el ultimo registro de un dia PASADO, no calculamos duración "hasta ahora"
                      // Podríamos setearlo a null o fin de jornada. Lo dejamos null para no mostrar info errónea.
                      durationLabel = null; 
                  }
                  
                  if (parsedNext || isToday(selectedDate.getDate())) {
                     const diff = msNext - msCurrent;
                     if (diff > 0) {
                        durationLabel = minutesToLabel(Math.floor(diff / 1000 / 60));
                     }
                  }
                }

                // Ocultar break-end y others-in
                if (type === 'break-end' || type === 'others-in') return null;

                const stateTitles: Record<string, string> = {
                  "clock-in": "Trabajando",
                  "clock-out": "Salida",
                  "break-start": "Descanso",
                  "break-end": "Entrada",
                  "others-in": "Fin Permiso",
                };

                const isStandard = Object.keys(stateTitles).includes(type);
                let displayLabel = isStandard ? stateTitles[type] : e.description ?? meta.label;
                 if (type === "others-out") {
                   const rawDesc = e.description || "";
                   displayLabel = rawDesc.replace(/^Permiso:\s*/i, "").replace(/^Salida:\s*/i, "") || "Permiso";
                }

                return (
                  <div key={e.id} className={`flex items-center gap-4 p-3 rounded-xl border-l-4 ${c.border} bg-white dark:bg-surface-dark shadow-sm group animate-in fade-in transition-all delay-[${idx * 50}ms]`}>
                    <div className={`size-10 rounded-full ${c.iconBg} flex items-center justify-center shrink-0`}>
                      <span className={`material-symbols-outlined text-xl ${c.iconText}`}>{meta.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{displayLabel}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{timeCell} • {meta.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       {durationLabel && (
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md transition-all">
                           {durationLabel}
                          </span>
                       )}
                      
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isEditingHistory ? 'w-8 opacity-100 ml-1' : 'w-0 opacity-0 ml-0'}`}>
                        {idx === 0 ? (
                          <button 
                            onClick={() => handleDelete(e.id)}
                            className="size-8 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer border-none shrink-0" 
                            title="Eliminar último registro"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => openEditModal(e)}
                            className="size-8 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-all cursor-pointer border-none shrink-0" 
                            title="Editar registro"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#151b26] border-t border-slate-200 dark:border-slate-800 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-30">
        <div className="relative flex justify-around items-center h-16 max-w-md mx-auto">
          {/* Left: Home */}
          <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center justify-center w-full h-full gap-1 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[26px]">home</span>
            <span className="text-[10px] font-medium">Inicio</span>
          </button>
          
          {/* Center: Add (Floating/Protruding Circle) */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2">
            <button 
              onClick={openAddModal} 
              className="size-16 rounded-full bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center border-4 border-background-light dark:border-background-dark active:scale-90 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined text-4xl">add</span>
            </button>
          </div>

          <div className="w-full"></div> {/* Spacer for central button */}

          {/* Right: History */}
          <button className="flex flex-col items-center justify-center w-full h-full gap-1 text-primary">
            <span className="material-symbols-outlined text-[26px]">calendar_month</span>
            <span className="text-[10px] font-bold">Historial</span>
          </button>
        </div>
      </nav>

      {/* Manual Entry Modal */}
      <div className={`fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4 transition-all duration-200 ${showModal ? 'visible opacity-100' : 'invisible opacity-0'}`}>
        <div onClick={() => { setShowModal(false); setContext(''); }} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div className={`relative w-full max-w-md bg-white dark:bg-surface-dark rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden transition-transform duration-300 ease-out ${showModal ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {editingEntry ? 'Editar Registro' : 'Añadir Registro Manual'}
            </h3>
            <button onClick={() => { setShowModal(false); setContext(''); setEditingEntry(null); }} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 border-none bg-transparent cursor-pointer">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <form className="p-5 space-y-4 no-scrollbar max-h-[85vh] overflow-y-auto" onSubmit={handleSave}>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo de Registro</label>
              <div className="grid grid-cols-2 gap-3">
                {/* ENTRADA */}
                <button 
                  type="button" 
                  onClick={() => setEntryType('clock-in')} 
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border ${
                    entryType === 'clock-in' 
                      ? 'bg-primary text-white border-primary shadow-md opacity-100 ring-2 ring-primary/20' 
                      : 'bg-primary text-white/70 border-gray-200 dark:border-gray-700 opacity-40 hover:opacity-70'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">login</span> Entrada
                </button>

                {/* SALIDA */}
                <button 
                  type="button" 
                  onClick={() => setEntryType('clock-out')} 
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border ${
                    entryType === 'clock-out' 
                      ? 'bg-slate-600 text-white border-slate-600 shadow-md opacity-100 ring-2 ring-slate-600/20' 
                      : 'bg-slate-600 text-white/70 border-gray-200 dark:border-gray-700 opacity-40 hover:opacity-70'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span> Salida
                </button>

                {/* DESCANSO (Toggle if editing, Interval if adding) */}
                <button 
                  type="button" 
                  onClick={() => {
                    if (editingEntry) {
                       if (entryType === 'break-start') setEntryType('break-end');
                       else setEntryType('break-start');
                    } else {
                       // ADD MODE: Just set interval type
                       setEntryType('break-interval' as any);
                    }
                  }} 
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border ${
                    (entryType === 'break-start' || entryType === 'break-end' || (entryType as any) === 'break-interval')
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md opacity-100 ring-2 ring-amber-500/20' 
                      : 'bg-amber-500 text-white/70 border-gray-200 dark:border-gray-700 opacity-40 hover:opacity-70'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {entryType === 'break-end' ? 'play_arrow' : 'coffee'}
                  </span> 
                  {/* Label logic: If editing, show specific. If adding, show generic "Descanso" */}
                  {editingEntry 
                    ? (entryType === 'break-end' ? 'Fin Descanso' : 'Inicio Descanso')
                    : 'Descanso'
                  }
                </button>

                {/* PERMISO (Toggle if editing, Interval if adding) */}
                <button 
                  type="button" 
                  onClick={() => {
                     if (editingEntry) {
                        if (entryType === 'others-out') setEntryType('others-in');
                        else setEntryType('others-out');
                     } else {
                        // ADD MODE: Just set interval type
                        setEntryType('others-interval' as any);
                     }
                  }} 
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border ${
                    (entryType === 'others-out' || entryType === 'others-in' || (entryType as any) === 'others-interval')
                      ? 'bg-pink-500 text-white border-pink-500 shadow-md opacity-100 ring-2 ring-pink-500/20' 
                      : 'bg-pink-500 text-white/70 border-gray-200 dark:border-gray-700 opacity-40 hover:opacity-70'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {(entryType === 'others-in' || (entryType as any) === 'others-interval') ? 'history_edu' : 'edit_note'}
                  </span>
                  {editingEntry 
                    ? (entryType === 'others-in' ? 'Fin Permiso' : 'Permiso')
                    : 'Permiso'
                  }
                </button>
              </div>
            </div>

            {/* Context for others */}
            {((entryType === 'others-in' || entryType === 'others-out' || (entryType as any) === 'others-interval')) && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contexto / Motivo</label>
                <input 
                  autoFocus
                  className="block w-full px-3 py-2.5 rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white focus:ring-pink-500 focus:border-pink-500 text-sm shadow-sm outline-none border transition-colors" 
                  type="text" 
                  placeholder="Ej: Visita médica, Diligencia..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
              <input 
                className="block w-full px-3 py-2.5 rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white focus:ring-primary focus:border-primary text-sm shadow-sm outline-none border" 
                type="date" 
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
            
            {/* Conditional Time Inputs: Single vs Range */}
            {((entryType as any) === 'break-interval' || (entryType as any) === 'others-interval') ? (
               <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora Inicio</label>
                    <input 
                      className="block w-full px-3 py-2.5 rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white focus:ring-primary focus:border-primary text-sm shadow-sm outline-none border" 
                      type="time" 
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora Fin</label>
                    <input 
                      className="block w-full px-3 py-2.5 rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white focus:ring-primary focus:border-primary text-sm shadow-sm outline-none border" 
                      type="time" 
                      value={formTimeEnd}
                      onChange={(e) => setFormTimeEnd(e.target.value)}
                    />
                  </div>
               </div>
            ) : (
                <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora</label>
                <input 
                  className="block w-full px-3 py-2.5 rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white focus:ring-primary focus:border-primary text-sm shadow-sm outline-none border" 
                  type="time" 
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                />
              </div>
            )}
            
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => { setShowModal(false); setContext(''); setEditingEntry(null); }} className="flex-1 py-3 px-4 rounded-xl text-center text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-none bg-transparent cursor-pointer" type="button">Cancelar</button>
              <button className={`flex-1 py-3 px-4 rounded-xl text-white text-sm font-bold shadow-lg transition-all hover:opacity-90 border-none cursor-pointer ${
                (entryType === 'clock-out') ? 'bg-slate-600 shadow-slate-600/25' :
                (entryType === 'break-start' || entryType === 'break-end' || (entryType as any) === 'break-interval') ? 'bg-amber-500 shadow-amber-500/25' :
                (entryType === 'others-in' || entryType === 'others-out' || (entryType as any) === 'others-interval') ? 'bg-pink-500 shadow-pink-500/25' :
                'bg-primary shadow-primary/25'
              }`} type="submit">
                {editingEntry ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HistoryScreen;
