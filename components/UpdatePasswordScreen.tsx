
import React, { useState, useMemo } from 'react';
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";
import { Logo } from "./Logo";

const UpdatePasswordScreen: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

    const [showPassword, setShowPassword] = useState(false);

    const canSubmit = useMemo(() => {
        const okPass = password.length >= 8 && /\d/.test(password) && /[A-Z]/.test(password);
        const okConfirm = password === confirmPassword;
        return okPass && okConfirm && !loading;
    }, [password, confirmPassword, loading]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        setLoading(false);

        if (error) {
            setMessage({ type: "error", text: error.message });
        } else {
            setMessage({ type: "success", text: "Contraseña actualizada satisfactoriamente." });
            setTimeout(() => {
                navigate("/dashboard");
            }, 1500);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background-light dark:bg-background-dark">
            <div className="w-full max-w-[480px] h-full flex flex-col relative">
                <div className="flex flex-col items-center justify-center py-8">
                     <div className="flex items-center gap-4 mb-8">
                         <Logo className="h-12 w-12 drop-shadow-xl" />
                         <span className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">Fycheo</span>
                      </div>
                    <h1 className="text-2xl font-bold tracking-tight text-center text-slate-900 dark:text-white/90">
                        Restablecer Contraseña
                    </h1>
                    <p className="text-slate-500 dark:text-[#92a4c9] mt-2 text-center text-sm font-medium">
                        Ingresa tu nueva contraseña a continuación
                    </p>
                </div>

                <form className="flex flex-col gap-5 w-full mt-4" onSubmit={handleUpdatePassword}>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-white ml-1">
                            Nueva contraseña
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">
                                    lock
                                </span>
                            </div>
                            <input
                                className="block w-full h-14 pl-12 pr-12 rounded-xl border-0 bg-white dark:bg-surface-dark ring-1 ring-inset ring-slate-200 dark:ring-[#324467] focus:ring-2 focus:ring-inset focus:ring-primary dark:focus:ring-primary sm:text-base sm:leading-6 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#92a4c9] shadow-sm transition-all outline-none"
                                placeholder="mínimo 8 caracteres"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {showPassword ? "visibility_off" : "visibility"}
                                </span>
                            </button>
                        </div>
                        
                        {/* Password Requirements */}
                        <div className="flex flex-wrap items-center gap-3 pt-1 pl-1">
                           {(() => {
                              const reqs = [
                                { label: "Mín. 8 caracteres", valid: password.length >= 8 },
                                { label: "Un número", valid: /\d/.test(password) },
                                { label: "Una mayúscula", valid: /[A-Z]/.test(password) },
                              ];
                              return reqs.map((req, idx) => (
                                <div key={idx} className={`flex items-center gap-1 text-xs font-medium transition-colors ${req.valid ? 'text-emerald-500' : 'text-slate-400'}`}>
                                   <span className="material-symbols-outlined text-[14px]">
                                      {req.valid ? 'check_circle' : 'radio_button_unchecked'}
                                   </span>
                                   {req.label}
                                </div>
                              ));
                           })()}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-white ml-1">
                            Confirmar contraseña
                        </label>
                         <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">
                                    lock_reset
                                </span>
                            </div>
                            <input
                                className="block w-full h-14 pl-12 pr-4 rounded-xl border-0 bg-white dark:bg-surface-dark ring-1 ring-inset ring-slate-200 dark:ring-[#324467] focus:ring-2 focus:ring-inset focus:ring-primary dark:focus:ring-primary sm:text-base sm:leading-6 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#92a4c9] shadow-sm transition-all outline-none"
                                placeholder="repite la contraseña"
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        {confirmPassword && (
                          <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium transition-colors ${password === confirmPassword ? 'text-emerald-500' : 'text-red-500'}`}>
                              <span className="material-symbols-outlined text-[14px]">
                                  {password === confirmPassword ? 'check_circle' : 'cancel'}
                              </span>
                              {password === confirmPassword ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                          </div>
                        )}
                    </div>

                    {message && (
                        <div
                            className={`rounded-xl px-4 py-3 text-sm font-semibold ring-1 ${
                                message.type === "error"
                                    ? "bg-red-500/10 text-red-200 ring-red-500/30"
                                    : "bg-emerald-500/10 text-emerald-200 ring-emerald-500/30"
                            }`}
                        >
                            {message.text}
                        </div>
                    )}

                    <div className="mt-2">
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="w-full h-14 bg-primary hover:bg-blue-600 disabled:opacity-60 text-white font-bold rounded-xl shadow-glow shadow-blue-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            <span>{loading ? "Actualizando..." : "Actualizar contraseña"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdatePasswordScreen;
