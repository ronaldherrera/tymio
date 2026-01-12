
import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { supabase } from '../services/supabase';

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser, setIsLoggedIn } = useContext(AppContext);
  const [showModal, setShowModal] = useState(false);
  const [entryType, setEntryType] = useState<'clock-in' | 'clock-out' | 'break-start' | 'break-end' | 'others-in' | 'others-out'>('clock-in');
  const [context, setContext] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

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
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-28 w-28 ring-4 ring-background-light dark:ring-background-dark shadow-lg" 
              style={{backgroundImage: `url("https://picsum.photos/seed/${user.id}/200/200")`}}
            ></div>
            <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 flex items-center justify-center shadow-md transform translate-x-1 translate-y-1">
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center mt-4 gap-1">
            <p className="text-slate-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] text-center">{displayName}</p>
            <p className="text-text-secondary text-base font-medium text-center">{user.role}</p>
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
