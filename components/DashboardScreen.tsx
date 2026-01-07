
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';

const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AppContext);
  
  const [status, setStatus] = useState<'working' | 'break' | 'out'>('working');
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date(new Date().getTime() - 4.25 * 60 * 60 * 1000));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [showModal, setShowModal] = useState(false);
  const [entryType, setEntryType] = useState<'clock-in' | 'clock-out' | 'break-start' | 'break-end' | 'others-in' | 'others-out'>('clock-in');
  const [context, setContext] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
      setElapsedSeconds(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const totals = useMemo(() => ({
    day: "4h 15m",
    week: "38h 40m",
    year: "1,452h 20m"
  }), []);

  const chartData = useMemo(() => [
    { label: 'Trabajando', hours: '944h 01m', value: 65, color: '#135bec' },
    { label: 'Descansando', hours: '217h 51m', value: 15, color: '#f59e0b' },
    { label: 'Libre', hours: '290h 28m', value: 20, color: '#475569' },
  ], []);

  const formatElapsed = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusLabel = () => {
    switch(status) {
      case 'working': return 'Trabajando';
      case 'break': return 'En Descanso';
      case 'out': return 'Fuera del trabajo';
      default: return '';
    }
  };

  const getStatusColor = () => {
    switch(status) {
      case 'working': return 'text-primary';
      case 'break': return 'text-amber-500';
      case 'out': return 'text-slate-400';
      default: return '';
    }
  };

  const handleAction = (newStatus: 'working' | 'break' | 'out') => {
    setStatus(newStatus);
    setSessionStartTime(new Date());
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTimeShort = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const renderDonut = () => {
    let cumulativePercent = 0;
    const size = 120;
    const center = size / 2;
    const radius = 45;
    const strokeWidth = 18;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 drop-shadow-sm">
        {chartData.map((item, index) => {
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
              className="transition-all duration-1000 ease-out"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display overflow-x-hidden min-h-screen flex flex-col max-w-md mx-auto relative shadow-2xl pb-32">
      <header className="w-full flex items-center justify-between p-4 pt-6 bg-background-light dark:bg-background-dark sticky top-0 z-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            {formatDateShort(currentTime)} • {formatTimeShort(currentTime)}
          </span>
          <h2 className="text-xl font-bold leading-tight tracking-tight">TimeFlow</h2>
        </div>
        
        <div 
          onClick={() => navigate('/profile')} 
          className="bg-center bg-no-repeat bg-cover rounded-full size-12 shadow-sm border-2 border-primary/20 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all" 
          style={{backgroundImage: `url("https://picsum.photos/seed/${user.id}/100/100")`}}
        ></div>
      </header>

      <main className="flex-1 px-4 flex flex-col gap-6">
        {/* Timer Section */}
        <section className="flex flex-col items-center justify-center py-10 bg-white dark:bg-surface-dark rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800/50 mt-2">
          <p className={`text-sm font-bold uppercase tracking-widest mb-2 ${getStatusColor()}`}>
            {getStatusLabel()}
          </p>
          <h1 className="text-6xl font-black tracking-tighter tabular-nums mb-2">
            {formatElapsed(elapsedSeconds)}
          </h1>
          <p className="text-slate-400 text-xs font-medium">Tiempo en este estado</p>
        </section>

        {/* Totals Section */}
        <section className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">Horas Trabajadas</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col items-center shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Día</span>
              <span className="text-sm font-bold text-primary">{totals.day}</span>
            </div>
            <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col items-center shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Semana</span>
              <span className="text-sm font-bold text-primary">{totals.week}</span>
            </div>
            <div className="bg-white dark:bg-surface-dark p-3 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col items-center shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Año</span>
              <span className="text-sm font-bold text-primary">{totals.year}</span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="w-full max-w-md mx-auto grid grid-cols-2 gap-4">
          <button onClick={() => handleAction('working')} className={`group flex flex-col items-center justify-center gap-2 p-5 rounded-xl transition-all shadow-lg shadow-primary/20 cursor-pointer bg-primary ring-4 ${status === 'working' ? 'ring-primary/40' : 'ring-transparent opacity-90 hover:opacity-100'}`}>
            <div className="size-10 rounded-full flex items-center justify-center bg-white/10">
              <span className="material-symbols-outlined text-2xl text-white">login</span>
            </div>
            <span className="font-bold text-sm tracking-wide text-white text-center">ENTRADA TRABAJO</span>
          </button>
          <button onClick={() => handleAction('out')} className={`group flex flex-col items-center justify-center gap-2 p-5 rounded-xl transition-all shadow-sm cursor-pointer bg-slate-600 dark:bg-slate-700 border-none ${status === 'out' ? 'ring-4 ring-slate-400/20' : 'opacity-90 hover:opacity-100'}`}>
            <div className="size-10 rounded-full flex items-center justify-center bg-white/10">
              <span className="material-symbols-outlined text-2xl text-white">logout</span>
            </div>
            <span className="font-bold text-sm tracking-wide text-white text-center">SALIDA TRABAJO</span>
          </button>
          <button onClick={() => handleAction('break')} className={`group flex flex-col items-center justify-center gap-2 p-5 rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer bg-amber-500 ring-4 ${status === 'break' ? 'ring-amber-500/40' : 'ring-transparent opacity-90 hover:opacity-100'}`}>
            <div className="size-10 rounded-full flex items-center justify-center bg-white/10">
              <span className="material-symbols-outlined text-2xl text-white">coffee</span>
            </div>
            <span className="font-bold text-sm tracking-wide leading-none text-center text-white">INICIO DESCANSO</span>
          </button>
          <button onClick={() => handleAction('working')} className="group flex flex-col items-center justify-center gap-2 p-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/25 cursor-pointer">
            <div className="size-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <span className="material-symbols-outlined text-white text-2xl">play_arrow</span>
            </div>
            <span className="text-white font-bold text-sm tracking-wide leading-none text-center">FIN DESCANSO</span>
          </button>
        </section>

        {/* Activity of the current day */}
        <section className="w-full max-w-md mx-auto mt-2">
          <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">Actividad del Día Actual</h4>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4 p-3 rounded-xl border-l-4 border-emerald-500 bg-white dark:bg-surface-dark shadow-sm">
              <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-500 text-xl">play_arrow</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Fin del descanso</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Hoy • 15:15</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Retorno</span>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-xl border-l-4 border-amber-500 bg-white dark:bg-surface-dark shadow-sm">
              <div className="size-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-500 text-xl">coffee</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Inicio del descanso</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Hoy • 14:30</p>
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">45m</span>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-xl border-l-4 border-primary bg-white dark:bg-surface-dark shadow-sm">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-xl">login</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Entrada al trabajo</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Hoy • 09:00</p>
              </div>
              <span className="text-xs font-bold text-primary">Inicio</span>
            </div>
          </div>
        </section>

        {/* Chart */}
        <section className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50 shadow-sm mb-4">
          <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-5">Distribución de Tiempo (Anual)</h4>
          <div className="flex items-center justify-around gap-4">
            <div className="relative flex items-center justify-center">
              {renderDonut()}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total</span>
                <span className="text-base font-black tracking-tight leading-none">{totals.year.split(' ')[0]}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold">{item.hours}</span>
                      <span className="text-[11px] font-light text-slate-400 dark:text-slate-500">({item.value}%)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#151b26] border-t border-slate-200 dark:border-slate-800 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-30">
        <div className="relative flex justify-around items-center h-16 max-w-md mx-auto">
          {/* Left: Home */}
          <button className="flex flex-col items-center justify-center w-full h-full gap-1 text-primary">
            <span className="material-symbols-outlined text-[26px]">home</span>
            <span className="text-[10px] font-bold">Inicio</span>
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
          <button onClick={() => navigate('/history')} className="flex flex-col items-center justify-center w-full h-full gap-1 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[26px]">calendar_month</span>
            <span className="text-[10px] font-medium">Historial</span>
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

            {/* Context Input (Shown when "Otros" is selected) */}
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
              <input className="block w-full px-3 py-2.5 rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white focus:ring-primary focus:border-primary text-sm shadow-sm outline-none border" type="date" defaultValue="2024-10-24"/>
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

export default DashboardScreen;
