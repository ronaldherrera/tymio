
import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { supabase } from '../services/supabase';
import { DEFAULT_AVATAR } from '../constants';

const startOfYear = (d: Date) => {
  const date = new Date(d.getFullYear(), 0, 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const minutesToLabel = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// Configuración visual consistente con Dashboard
const CHART_COLORS = {
  working: "#3b82f6", // blue-500
  break: "#f59e0b",   // amber-500
  others: "#ec4899",  // pink-500
  free: "#cbd5e1",    // slate-300
};

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, setIsLoggedIn } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const [entryType, setEntryType] = useState<'clock-in' | 'clock-out' | 'break-start' | 'break-end' | 'others-in' | 'others-out'>('clock-in');
  const [context, setContext] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Year Stats State
  const [yearStats, setYearStats] = useState<{ w: number; b: number; o: number }>({ w: 0, b: 0, o: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  // Export State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportRange, setExportRange] = useState<'month' | 'last-month' | 'year' | 'custom'>('month');
  const [isExporting, setIsExporting] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const handleExport = async () => {
    try {
      setIsExporting(true);
      if (!user) return;

      const now = new Date();
      let start = new Date();
      let end = new Date();
      let filename = 'fichajes';

      if (exportRange === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        filename = `fichajes_${now.getFullYear()}_${now.getMonth() + 1}`;
      } else if (exportRange === 'last-month') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        filename = `fichajes_${start.getFullYear()}_${start.getMonth() + 1}`;
      } else if (exportRange === 'year') {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        filename = `fichajes_${now.getFullYear()}_anual`;
      } else if (exportRange === 'custom') {
         if (!customStartDate || !customEndDate) {
            setMessage({ type: 'error', text: 'Debes seleccionar fechas de inicio y fin.' });
            setIsExporting(false);
            return;
         }
         const [y1, m1, d1] = customStartDate.split('-').map(Number);
         const [y2, m2, d2] = customEndDate.split('-').map(Number);
         
         start = new Date(y1, m1 - 1, d1, 0, 0, 0);
         end = new Date(y2, m2 -1, d2, 23, 59, 59);
         
         if (start > end) {
             setMessage({ type: 'error', text: 'La fecha de inicio no puede ser posterior a la de fin.' });
             setIsExporting(false);
             return;
         }
         filename = `fichajes_personalizado_${customStartDate}_${customEndDate}`;
      }

      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("occurred_at", start.toISOString())
        .lte("occurred_at", end.toISOString())
        .order("occurred_at", { ascending: true });

      if (error || !data || data.length === 0) {
        setMessage({ type: 'error', text: 'No hay datos para exportar en este periodo' });
        setIsExporting(false);
        return;
      }

      // Generate CSV
      // Headers
      let csvContent = "Fecha,Hora,Descripcion\n";
      
      data.forEach((row) => {
          const d = row.occurred_at ? new Date(row.occurred_at) : new Date(row.created_at);
          const dateStr = d.toLocaleDateString('es-ES');
          const timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          
          let typeLabel = '';
          // Traducir tipos básicos para fallback
          if (row.entry_type === 'clock-in') typeLabel = 'Entrada';
          else if (row.entry_type === 'clock-out') typeLabel = 'Salida';
          else if (row.entry_type === 'break-start') typeLabel = 'Inicio Descanso';
          else if (row.entry_type === 'break-end') typeLabel = 'Fin Descanso';
          else if (row.entry_type === 'others-out') typeLabel = 'Salida (Permiso)';
          else if (row.entry_type === 'others-in') typeLabel = 'Entrada (Permiso)';
          else typeLabel = 'Registro';
          
          // Lógica de descripción: Usar descripción de usuario si existe, sino el tipo
          let finalDesc = row.description || typeLabel;
          // Limpiar comas para CSV
          finalDesc = finalDesc.replace(/,/g, ' '); 

          csvContent += `${dateStr},${timeStr},${finalDesc}\n`;
      });

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMessage({ type: 'success', text: 'Informe descargado correctamente' });
      setShowExportModal(false);

    } catch (err: any) {
      setMessage({ type: 'error', text: 'Error al exportar: ' + err.message });
    } finally {
      setIsExporting(false);
    }
  };

  // Fallback name logic: prioritize user_metadata.full_name -> user.name -> email username
  const displayName = user.user_metadata?.full_name || user.name || user.email?.split('@')[0] || 'Usuario';
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const loadYearStats = async () => {
      if (!user) return;
      
      const now = new Date();
      const start = startOfYear(now);
      
      const { data, error } = await supabase
        .from("time_entries")
        .select("entry_type, occurred_at, created_at")
        .eq("user_id", user.id)
        .gte("occurred_at", start.toISOString())
        .order("occurred_at", { ascending: true });

      if (error || !data) {
        setLoadingStats(false);
        return;
      }

      let w = 0, b = 0, o = 0;
      let lastState: 'working' | 'break' | 'others' | 'out' = 'out';
      let lastTime = 0;

      // Simplificación: Asumimos estado inicial 'out' el 1 de Enero o antes del primer registro
      
      for (const e of data) {
         const eTime = e.occurred_at ? new Date(e.occurred_at).getTime() : new Date(e.created_at).getTime();
         
         if (lastTime > 0) {
            const diffMins = Math.floor((eTime - lastTime) / 1000 / 60);
            // Filtro de seguridad: ignorar intervalos > 16h (olvidos probables) para evitar ensuciar la gráfica
            if (diffMins > 0 && diffMins < 960) { 
                if (lastState === 'working') w += diffMins;
                else if (lastState === 'break') b += diffMins;
                else if (lastState === 'others') o += diffMins;
            }
         }

         const t = (e.entry_type || '').toLowerCase();
         if (t === 'clock-in') lastState = 'working';
         else if (t === 'break-start') lastState = 'break';
         else if (t === 'break-end') lastState = 'working';
         else if (t === 'others-out') lastState = 'others';
         else if (t === 'others-in') lastState = 'working';
         else if (t === 'clock-out') lastState = 'out';
         
         lastTime = eTime;
      }
      
      // Sumar hasta ahora si el estado es activo
      if (lastState !== 'out' && lastTime > 0) {
          const nowTime = now.getTime();
          const diff = Math.floor((nowTime - lastTime) / 1000 / 60);
          if (diff > 0 && diff < 960) {
             if (lastState === 'working') w += diff;
             else if (lastState === 'break') b += diff;
             else if (lastState === 'others') o += diff;
          }
      }

      setYearStats({ w, b, o });
      setLoadingStats(false);
    };

    loadYearStats();
  }, [user]);

  const renderDonut = () => {
    const { w, b, o } = yearStats;
    const total = w + b + o; // Total registrado
    
    // Si no hay datos
    if (total === 0) {
        return (
            <div className="flex items-center justify-center h-32 w-32 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400">Sin datos</span>
            </div>
        );
    }

    const data = [
        { value: w, color: CHART_COLORS.working },
        { value: b, color: CHART_COLORS.break },
        { value: o, color: CHART_COLORS.others },
    ];

    let cumulativePercent = 0;
    const size = 120;
    const center = size / 2;
    const radius = 45;
    const strokeWidth = 18;

    // Caso 100% de un solo tipo
    const fullItem = data.find(d => d.value > 0 && d.value === total);
    if (fullItem) {
        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 drop-shadow-sm shrink-0">
               <circle cx={center} cy={center} r={radius} fill="none" stroke={fullItem.color} strokeWidth={strokeWidth} />
            </svg>
        );
    }

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 drop-shadow-sm shrink-0">
        {data.map((item, index) => {
           if (item.value <= 0) return null;
           const percent = (item.value / total) * 100;
           const startPercent = cumulativePercent;
           const endPercent = cumulativePercent + percent;
           cumulativePercent = endPercent;

           const startAngle = (startPercent / 100) * 2 * Math.PI;
           const endAngle = (endPercent / 100) * 2 * Math.PI;
           const x1 = center + radius * Math.cos(startAngle);
           const y1 = center + radius * Math.sin(startAngle);
           const x2 = center + radius * Math.cos(endAngle);
           const y2 = center + radius * Math.sin(endAngle);
           const largeArcFlag = percent > 50 ? 1 : 0;
           const pathData = [`M ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`].join(' ');

           return (
             <path key={index} d={pathData} fill="none" stroke={item.color} strokeWidth={strokeWidth} strokeLinecap="round" />
           );
        })}
      </svg>
    );
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Debes seleccionar una imagen para subir.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      const { data: userData, error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) {
        throw updateError;
      }

      if (userData.user) {
        setUser(userData.user);
        setMessage({ type: 'success', text: 'Foto de perfil actualizada' });
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      setMessage({ type: 'error', text: error.message || 'Error al actualizar la foto de perfil.' });
    } finally {
      setUploading(false);
    }
  };




  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto shadow-2xl bg-background-light dark:bg-background-dark pb-32">
      <div className="sticky top-0 z-50 flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between border-b dark:border-border-dark/30 border-gray-200">
        <div onClick={() => navigate('/dashboard')} className="flex size-12 shrink-0 items-center justify-start text-slate-900 dark:text-white cursor-pointer hover:opacity-70 transition-opacity">
          <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
        </div>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Mi Perfil</h2>
        <div className="flex w-12 items-center justify-end">
          <button className="text-primary text-base font-bold leading-normal tracking-[0.015em] shrink-0 hover:opacity-80 transition-opacity">Editar</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex p-4 flex-col items-center pt-8">
          <div className="relative group cursor-pointer">
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-28 w-28 ring-4 ring-background-light dark:ring-background-dark shadow-lg relative" 
              style={{backgroundImage: `url("${user.user_metadata?.avatar_url || DEFAULT_AVATAR}")`}}
            >
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 flex items-center justify-center shadow-md transform translate-x-1 translate-y-1 cursor-pointer hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            </div>
            <input
              type="file"
              id="avatar"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
          </div>
          <div className="flex flex-col items-center justify-center mt-4 gap-1">
            <p className="text-slate-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] text-center">{displayName}</p>

            <span className="inline-flex items-center gap-x-1.5 py-1 px-3 rounded-full text-xs font-medium bg-primary/10 text-primary mt-1">
              ID: {user.id}
            </span>
          </div>
        </div>

        <div className="mt-2">
          <h3 className="text-slate-500 dark:text-text-secondary text-xs font-bold uppercase tracking-wider px-4 pb-2 pt-4">Información Personal</h3>
          <div className="bg-white dark:bg-surface-dark mx-4 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-border-dark/50">
            <div className="flex flex-col px-4 py-3 border-b border-gray-100 dark:border-border-dark/50">
              <label className="text-xs text-text-secondary font-medium mb-1">Nombre Completo</label>
              <div className="flex items-center">
                <span className="material-symbols-outlined text-text-secondary mr-3 text-[20px]">person</span>
                <input 
                  readOnly={!isEditingName}
                  className={`flex-1 bg-transparent border-none p-0 text-slate-900 dark:text-white text-base font-medium outline-none transition-colors ${isEditingName ? 'border-b border-primary/50' : ''}`} 
                  value={isEditingName ? tempName : displayName}
                  onChange={(e) => setTempName(e.target.value)}
                  ref={(input) => { if (isEditingName && input) input.focus(); }}
                />
                
                {/* Actions */}
                <div className="flex items-center gap-1 ml-2">
                  {!isEditingName ? (
                    <button 
                      onClick={() => {
                        setTempName(displayName);
                        setIsEditingName(true);
                      }}
                      className="p-1 text-slate-400 hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={async () => {
                          if (!tempName.trim()) {
                            setMessage({ type: 'error', text: 'El nombre no puede estar vacío' });
                            return;
                          }
                          const { data, error } = await supabase.auth.updateUser({
                            data: { full_name: tempName }
                          });
                          if (error) {
                            setMessage({ type: 'error', text: error.message });
                          } else {
                            if (data.user) {
                              setUser(data.user);
                            }
                            setMessage({ type: 'success', text: 'Nombre actualizado' });
                            setIsEditingName(false);
                          }
                        }}
                        className="p-1 text-green-500 hover:text-green-600 transition-colors cursor-pointer border-none bg-transparent"
                      >
                         <span className="material-symbols-outlined text-[20px]">check</span>
                      </button>
                      <button 
                        onClick={() => {
                          setIsEditingName(false);
                          setTempName(displayName);
                        }}
                        className="p-1 text-red-500 hover:text-red-600 transition-colors cursor-pointer border-none bg-transparent"
                      >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col px-4 py-3 border-b border-gray-100 dark:border-border-dark/50">
              <label className="text-xs text-text-secondary font-medium mb-1">Correo Electrónico</label>
              <div className="flex items-center">
                <span className="material-symbols-outlined text-text-secondary mr-3 text-[20px]">mail</span>
                <input readOnly className="flex-1 bg-transparent border-none p-0 text-slate-900 dark:text-white focus:ring-0 text-base font-medium outline-none" defaultValue={user.email}/>
              </div>
            </div>



          </div>
        </div>


        <div className="mt-6">
          <h3 className="text-slate-500 dark:text-text-secondary text-xs font-bold uppercase tracking-wider px-4 pb-2">Empresa</h3>
          <div className="bg-white dark:bg-surface-dark mx-4 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-border-dark/50">
            <button 
              onClick={() => setMessage({ type: 'info', text: 'Esta opción aún no está disponible' })}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left group border-none bg-transparent cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <span className="material-symbols-outlined text-[20px]">business</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-900 dark:text-white font-medium text-base">Vincular Empresa</span>
                  <span className="text-xs text-text-secondary">Conectar con un espacio de trabajo</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-text-secondary group-hover:text-primary transition-colors text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-slate-500 dark:text-text-secondary text-xs font-bold uppercase tracking-wider px-4 pb-2">Resumen Anual</h3>
          <div className="bg-white dark:bg-surface-dark mx-4 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-border-dark/50">
             <div className="p-5 flex items-center justify-between border-b border-gray-100 dark:border-border-dark/50">
             {loadingStats ? (
                <div className="w-full flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
             ) : (
                <>
                   {renderDonut()}
                   <div className="flex flex-col gap-2.5 flex-1 w-full ml-4">
                      {/* WORKING */}
                      <div className="flex items-center justify-between w-full">
                         <div className="flex items-center gap-2">
                             <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.working }}></span>
                             <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Trabajando</span>
                         </div>
                         <div className="flex flex-col items-end">
                             <span className="text-sm font-bold text-slate-900 dark:text-white">{minutesToLabel(yearStats.w)}</span>
                             <span className="text-[10px] text-slate-400 font-medium">
                                {yearStats.w + yearStats.b + yearStats.o > 0 
                                  ? Math.round((yearStats.w / (yearStats.w + yearStats.b + yearStats.o)) * 100) 
                                  : 0}%
                             </span>
                         </div>
                      </div>
                      
                      {/* BREAK */}
                      <div className="flex items-center justify-between w-full">
                         <div className="flex items-center gap-2">
                             <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.break }}></span>
                             <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Descanso</span>
                         </div>
                         <div className="flex flex-col items-end">
                             <span className="text-sm font-bold text-slate-900 dark:text-white">{minutesToLabel(yearStats.b)}</span>
                             <span className="text-[10px] text-slate-400 font-medium">
                                {yearStats.w + yearStats.b + yearStats.o > 0 
                                  ? Math.round((yearStats.b / (yearStats.w + yearStats.b + yearStats.o)) * 100) 
                                  : 0}%
                             </span>
                         </div>
                      </div>

                      {/* OTHERS */}
                      <div className="flex items-center justify-between w-full">
                         <div className="flex items-center gap-2">
                             <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.others }}></span>
                             <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Permiso</span>
                         </div>
                         <div className="flex flex-col items-end">
                             <span className="text-sm font-bold text-slate-900 dark:text-white">{minutesToLabel(yearStats.o)}</span>
                             <span className="text-[10px] text-slate-400 font-medium">
                                {yearStats.w + yearStats.b + yearStats.o > 0 
                                  ? Math.round((yearStats.o / (yearStats.w + yearStats.b + yearStats.o)) * 100) 
                                  : 0}%
                             </span>
                         </div>
                      </div>
                   </div>
                </>
             )}
             </div>
             
             {/* Export Button */}
             <button 
                onClick={() => setShowExportModal(true)}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left group border-none bg-transparent cursor-pointer"
             >
                <div className="flex items-center gap-3">
                   <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <span className="material-symbols-outlined text-[20px]">download</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-slate-900 dark:text-white font-medium text-base">Exportar Datos</span>
                      <span className="text-xs text-text-secondary">Descargar informe en Excel (CSV)</span>
                   </div>
                </div>
                <span className="material-symbols-outlined text-text-secondary group-hover:text-primary transition-colors text-[20px]">chevron_right</span>
             </button>
          </div>
        </div>

      {/* Export Modal (Drawer) */}
      <div className={`fixed inset-0 z-[80] flex items-end justify-center sm:items-center p-0 sm:p-4 transition-all duration-200 ${showExportModal ? 'visible opacity-100' : 'invisible opacity-0'}`}>
        <div onClick={() => setShowExportModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div className={`relative w-full max-w-sm bg-white dark:bg-surface-dark rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden transition-transform duration-300 ease-out border border-slate-100 dark:border-slate-800 ${showExportModal ? 'translate-y-0' : 'translate-y-full'}`}>
           <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                   <span className="material-symbols-outlined text-emerald-500">table_view</span>
                   Exportar Informe
                </h3>
                <button onClick={() => setShowExportModal(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 border-none bg-transparent cursor-pointer">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-4 mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecciona el periodo</label>
                  <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={() => setExportRange('month')}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${exportRange === 'month' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                      >
                          <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-slate-400">calendar_today</span>
                              <div className="flex flex-col items-start">
                                  <span className={`text-sm font-bold ${exportRange === 'month' ? 'text-primary' : 'text-slate-700 dark:text-white'}`}>Este Mes</span>
                                  <span className="text-[10px] text-slate-400">Actividad del mes en curso</span>
                              </div>
                          </div>
                          {exportRange === 'month' && <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>}
                      </button>

                      <button 
                        onClick={() => setExportRange('last-month')}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${exportRange === 'last-month' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                      >
                          <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-slate-400">history</span>
                              <div className="flex flex-col items-start">
                                  <span className={`text-sm font-bold ${exportRange === 'last-month' ? 'text-primary' : 'text-slate-700 dark:text-white'}`}>Mes Pasado</span>
                                  <span className="text-[10px] text-slate-400">Actividad del mes anterior completo</span>
                              </div>
                          </div>
                          {exportRange === 'last-month' && <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>}
                      </button>

                      <button 
                        onClick={() => setExportRange('year')}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${exportRange === 'year' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                      >
                          <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-slate-400">calendar_month</span>
                              <div className="flex flex-col items-start">
                                  <span className={`text-sm font-bold ${exportRange === 'year' ? 'text-primary' : 'text-slate-700 dark:text-white'}`}>Todo el Año</span>
                                  <span className="text-[10px] text-slate-400">Histórico anual completo</span>
                              </div>
                          </div>
                          {exportRange === 'year' && <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>}
                      </button>

                      {/* Opción Personalizado (Contenedor DIV para inputs internos) */}
                      <div 
                        className={`rounded-xl border transition-all overflow-hidden ${exportRange === 'custom' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                      >
                          <div 
                             onClick={() => setExportRange('custom')}
                             className="flex items-center justify-between p-3 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-slate-400">date_range</span>
                                <div className="flex flex-col items-start">
                                    <span className={`text-sm font-bold ${exportRange === 'custom' ? 'text-primary' : 'text-slate-700 dark:text-white'}`}>Personalizado</span>
                                    <span className="text-[10px] text-slate-400">Elegir fechas exactas</span>
                                </div>
                            </div>
                            {exportRange === 'custom' && <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>}
                          </div>

                          <div 
                             className={`grid transition-[grid-template-rows,opacity,padding] duration-300 ease-in-out ${exportRange === 'custom' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                          >
                             <div className="overflow-hidden">
                                <div className="grid grid-cols-2 gap-3 px-3 pb-3 pt-0">
                                    <div className="space-y-1">
                                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Desde</label>
                                       <input 
                                          type="date" 
                                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 dark:text-white text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary border shadow-sm"
                                          value={customStartDate}
                                          onChange={(e) => setCustomStartDate(e.target.value)}
                                       />
                                    </div>
                                    <div className="space-y-1">
                                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Hasta</label>
                                       <input 
                                          type="date" 
                                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 dark:text-white text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary border shadow-sm"
                                          value={customEndDate}
                                          onChange={(e) => setCustomEndDate(e.target.value)}
                                       />
                                    </div>
                                </div>
                             </div>
                          </div>
                      </div>
                  </div>
              </div>

              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-slate-900 dark:bg-white dark:text-black hover:opacity-90 transition-all flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-50"
              >
                 {isExporting ? (
                    <>
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       <span>Generando...</span>
                    </>
                 ) : (
                    <>
                       <span className="material-symbols-outlined">download</span>
                       <span>Descargar Excel (CSV)</span>
                    </>
                 )}
              </button>
           </div>
        </div>
      </div>

        <div className="mt-6">
          <h3 className="text-slate-500 dark:text-text-secondary text-xs font-bold uppercase tracking-wider px-4 pb-2">Seguridad</h3>
          <div className="bg-white dark:bg-surface-dark mx-4 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-border-dark/50 divide-y divide-gray-100 dark:divide-border-dark/50">
            <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left group border-none bg-transparent cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <span className="material-symbols-outlined text-[20px]">password</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-900 dark:text-white font-medium text-base">Cambiar Contraseña</span>
                  <span className="text-xs text-text-secondary">Actualizar clave de acceso</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-text-secondary group-hover:text-primary transition-colors text-[20px]">chevron_right</span>
            </button>

            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                  <span className="material-symbols-outlined text-[20px]">face</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-900 dark:text-white font-medium text-base">Face ID</span>
                  <span className="text-xs text-text-secondary">Usar biométricos</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input defaultChecked className="sr-only peer" type="checkbox" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 mb-8 mx-4">
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              setIsLoggedIn(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-base transition-colors hover:bg-red-100 dark:hover:bg-red-500/20 border-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Cerrar Sesión
          </button>
          <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-4 font-medium">Versión 1.0.0</p>
        </div>
      </div>

      {/* Toast Notification */}
      <div 
        className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-lg z-[100] transition-all duration-300 pointer-events-none flex items-center gap-2
        ${message ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        ${message?.type === 'error' ? 'bg-red-500 text-white' : ''}
        ${message?.type === 'success' ? 'bg-green-500 text-white' : ''}
        ${message?.type === 'info' ? 'bg-slate-700 text-white' : ''}
        `}
      >
        {message?.type === 'info' && <span className="material-symbols-outlined text-[18px]">info</span>}
        <span className="text-sm font-medium">{message?.text}</span>
      </div>

      {/* Consistent Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#151b26] border-t border-slate-200 dark:border-slate-800 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-30">
        <div className="relative flex justify-around items-center h-16 max-w-md mx-auto">
          {/* Left: Home */}
          <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center justify-center w-full h-full gap-1 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors border-none bg-transparent cursor-pointer">
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

          <div className="w-full"></div> {/* Spacer */}

          {/* Right: History */}
          <button onClick={() => navigate('/history')} className="flex flex-col items-center justify-center w-full h-full gap-1 text-slate-400 dark:text-slate-500 hover:text-primary transition-colors border-none bg-transparent cursor-pointer">
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

export default ProfileScreen;
