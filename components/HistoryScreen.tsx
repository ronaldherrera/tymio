
import React, { useState, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';

const HistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const [entryType, setEntryType] = useState<'clock-in' | 'clock-out' | 'break-start' | 'break-end' | 'others-in' | 'others-out'>('clock-in');
  const [context, setContext] = useState('');
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  const dailyDistribution = useMemo(() => [
    { label: 'Trabajando', hours: '8h 15m', value: 68, color: '#135bec' },
    { label: 'Descansando', hours: '1h 00m', value: 12, color: '#f59e0b' },
    { label: 'Libre', hours: '2h 45m', value: 20, color: '#475569' },
  ], [selectedDate]);

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
            style={{backgroundImage: `url("https://picsum.photos/seed/${user.id}/100/100")`}}
          ></div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 flex flex-col gap-6">
        {/* Calendar Controller */}
        <div className="flex items-center justify-between px-2 bg-white dark:bg-surface-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/50">
          <button onClick={prevMonth} className="p-2 rounded-xl text-gray-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-none bg-transparent cursor-pointer">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="flex flex-col items-center">
            <span className="text-gray-900 dark:text-white font-black text-lg tracking-tight">
              {monthNames[currentDate.getMonth()]}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
              {currentDate.getFullYear()}
            </span>
          </div>
          <button onClick={nextMonth} className="p-2 rounded-xl text-gray-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-none bg-transparent cursor-pointer">
            <span className="material-symbols-outlined">chevron_right</span>
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
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Registros de Actividad</h4>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800/50 shadow-sm">
              <div className="size-10 rounded-full bg-slate-600/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-slate-600 text-xl">logout</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Salida Trabajo</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Final de jornada</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-slate-900 dark:text-white">18:30</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800/50 shadow-sm">
              <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-emerald-600 text-xl">play_arrow</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Fin Descanso</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Retorno a tareas</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-slate-900 dark:text-white">15:15</span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800/50 shadow-sm">
              <div className="size-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-amber-600 text-xl">coffee</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Inicio Descanso</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Pausa comida</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-slate-900 dark:text-white">14:30</span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800/50 shadow-sm">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-xl">login</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Entrada Trabajo</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Inicio de jornada</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-slate-900 dark:text-white">09:00</span>
              </div>
            </div>
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
              onClick={() => setShowModal(true)} 
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
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Añadir Registro Manual</h3>
            <button onClick={() => { setShowModal(false); setContext(''); }} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 border-none bg-transparent cursor-pointer">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <form className="p-5 space-y-4 no-scrollbar max-h-[85vh] overflow-y-auto" onSubmit={(e) => { e.preventDefault(); setShowModal(false); setContext(''); }}>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo de Registro</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setEntryType('clock-in')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border ${entryType === 'clock-in' ? 'bg-primary text-white border-primary shadow-md' : 'bg-transparent text-gray-500 border-gray-200 dark:border-gray-700 hover:border-primary'}`}>
                  <span className="material-symbols-outlined text-[18px]">login</span> Entrada
                </button>
                <button type="button" onClick={() => setEntryType('clock-out')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border ${entryType === 'clock-out' ? 'bg-slate-600 text-white border-slate-600 shadow-md' : 'bg-transparent text-gray-500 border-gray-200 dark:border-gray-700 hover:border-slate-600'}`}>
                  <span className="material-symbols-outlined text-[18px]">logout</span> Salida
                </button>
                <button type="button" onClick={() => setEntryType('break-start')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border ${entryType === 'break-start' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-transparent text-gray-500 border-gray-200 dark:border-gray-700 hover:border-amber-500'}`}>
                  <span className="material-symbols-outlined text-[18px]">coffee</span> Inicio Descanso
                </button>
                <button type="button" onClick={() => setEntryType('break-end')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border ${entryType === 'break-end' ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : 'bg-transparent text-gray-500 border-gray-200 dark:border-gray-700 hover:border-emerald-500'}`}>
                  <span className="material-symbols-outlined text-[18px]">play_arrow</span> Fin Descanso
                </button>
                {/* Reordered "Otros" Buttons: Salida (Otros) left, Entrada (Otros) right */}
                <button type="button" onClick={() => setEntryType('others-out')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border ${entryType === 'others-out' ? 'bg-pink-400 text-white border-pink-400 shadow-md' : 'bg-transparent text-gray-500 border-gray-200 dark:border-gray-700 hover:border-pink-400'}`}>
                  <span className="material-symbols-outlined text-[18px]">edit_note</span> Salida (Otros)
                </button>
                <button type="button" onClick={() => setEntryType('others-in')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all border ${entryType === 'others-in' ? 'bg-pink-500 text-white border-pink-500 shadow-md' : 'bg-transparent text-gray-500 border-gray-200 dark:border-gray-700 hover:border-pink-500'}`}>
                  <span className="material-symbols-outlined text-[18px]">history_edu</span> Entrada (Otros)
                </button>
              </div>
            </div>

            {(entryType === 'others-in' || entryType === 'others-out') && (
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
              <input className="block w-full px-3 py-2.5 rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white focus:ring-primary focus:border-primary text-sm shadow-sm outline-none border" type="date" defaultValue={selectedDate.toISOString().split('T')[0]}/>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora</label>
              <input className="block w-full px-3 py-2.5 rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white focus:ring-primary focus:border-primary text-sm shadow-sm outline-none border" type="time" defaultValue="08:00"/>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => { setShowModal(false); setContext(''); }} className="flex-1 py-3 px-4 rounded-xl text-center text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-none bg-transparent cursor-pointer" type="button">Cancelar</button>
              <button className={`flex-1 py-3 px-4 rounded-xl text-white text-sm font-bold shadow-lg transition-all hover:opacity-90 border-none cursor-pointer ${(entryType === 'others-in' || entryType === 'others-out') ? 'bg-pink-500 shadow-pink-500/25' : 'bg-primary shadow-primary/25'}`} type="submit">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HistoryScreen;
