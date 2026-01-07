
import React, { useContext } from 'react';
import { AppContext } from '../App';

const LoginScreen: React.FC = () => {
  const { setIsLoggedIn } = useContext(AppContext);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark">
      <div className="w-full max-w-[480px] h-full flex flex-col relative">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="h-20 w-20 bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-glow flex items-center justify-center mb-6 text-white transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <span className="material-symbols-outlined text-[40px]">schedule</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-center text-slate-900 dark:text-white">Bienvenido</h1>
          <p className="text-slate-500 dark:text-[#92a4c9] mt-3 text-center text-base font-medium">Controla tu tiempo, maximiza tu día</p>
        </div>

        <form className="flex flex-col gap-5 w-full mt-4" onSubmit={handleLogin}>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-white ml-1">Correo electrónico</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">mail</span>
              </div>
              <input 
                className="block w-full h-14 pl-12 pr-4 rounded-xl border-0 bg-white dark:bg-surface-dark ring-1 ring-inset ring-slate-200 dark:ring-[#324467] focus:ring-2 focus:ring-inset focus:ring-primary dark:focus:ring-primary sm:text-base sm:leading-6 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#92a4c9] shadow-sm transition-all outline-none" 
                placeholder="nombre@empresa.com" 
                type="email" 
                defaultValue="carlos.r@empresa.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-white ml-1">Contraseña</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">lock</span>
              </div>
              <input 
                className="block w-full h-14 pl-12 pr-12 rounded-xl border-0 bg-white dark:bg-surface-dark ring-1 ring-inset ring-slate-200 dark:ring-[#324467] focus:ring-2 focus:ring-inset focus:ring-primary dark:focus:ring-primary sm:text-base sm:leading-6 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#92a4c9] shadow-sm transition-all outline-none" 
                placeholder="••••••••" 
                type="password" 
                defaultValue="password123"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[20px]">visibility</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <a className="text-sm font-semibold text-primary hover:text-blue-400 transition-colors" href="#">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <div className="flex gap-3 mt-2">
            <button type="submit" className="flex-1 h-14 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-glow shadow-blue-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
              <span>Iniciar Sesión</span>
            </button>
            <button aria-label="Face ID Login" className="h-14 w-14 bg-white dark:bg-surface-dark hover:bg-slate-50 dark:hover:bg-[#202b40] ring-1 ring-inset ring-slate-200 dark:ring-[#324467] rounded-xl flex items-center justify-center text-primary transition-all active:scale-[0.95]" type="button">
              <span className="material-symbols-outlined text-[28px]">face</span>
            </button>
          </div>
        </form>

        <div className="relative py-8 flex items-center gap-4">
          <div className="h-px bg-slate-200 dark:bg-[#324467] flex-1"></div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">O accede con</span>
          <div className="h-px bg-slate-200 dark:bg-[#324467] flex-1"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="h-12 flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-surface-dark ring-1 ring-inset ring-slate-200 dark:ring-[#324467] hover:bg-slate-50 dark:hover:bg-[#202b40] transition-colors group">
            <span className="material-symbols-outlined text-2xl text-slate-900 dark:text-white group-hover:scale-110 transition-transform">smartphone</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-white">Apple</span>
          </button>
          <button className="h-12 flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-surface-dark ring-1 ring-inset ring-slate-200 dark:ring-[#324467] hover:bg-slate-50 dark:hover:bg-[#202b40] transition-colors group">
            <div className="w-5 h-5 rounded-full border-4 border-l-blue-500 border-t-red-500 border-r-yellow-400 border-b-green-500 group-hover:rotate-90 transition-transform duration-500"></div>
            <span className="text-sm font-semibold text-slate-700 dark:text-white">Google</span>
          </button>
        </div>

        <div className="mt-auto pt-8 pb-4 text-center">
          <p className="text-slate-500 dark:text-[#92a4c9] text-sm font-medium">
            ¿No tienes una cuenta? 
            <a className="font-bold text-primary hover:text-blue-400 ml-1 transition-colors" href="#">Crear cuenta nueva</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
