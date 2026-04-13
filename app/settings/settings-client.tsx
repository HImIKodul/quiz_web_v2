"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { User, Lock, Edit3, Smartphone, CreditCard, Moon, Sun, Monitor, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsClientProps {
  user: {
    name: string;
    identifier: string;
    plan: string;
    planExpireDate: string | null;
    devicesCount: number;
    maxDevices: number;
  };
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Алдаа гарлаа.");
      
      setMessage({ type: "success", text: "Мэдээлэл амжилттай шинэчлэгдлээ." });
      setPassword("");
      setNewPassword("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Profile Update Form */}
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleUpdateProfile} className="glass-card p-6 dark:bg-slate-900/50 bg-white/50 border dark:border-white/5 border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
              <Edit3 size={20} />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Хувийн мэдээлэл</h2>
          </div>

          {message && (
            <div className={cn(
              "p-4 mb-6 rounded-lg text-sm",
              message.type === "success" 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
            )}>
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Нэр</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 py-3 pl-10 pr-4 text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/5">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">Нууц үг солих (Сонголттой)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      placeholder="Хуучин нууц үг"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 py-3 pl-10 pr-4 text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      placeholder="Шинэ нууц үг"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 py-3 pl-10 pr-4 text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="premium-gradient group relative flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Хадгалах"}
              </button>
            </div>
          </div>
        </form>

        {/* Theme Toggler */}
        <div className="glass-card p-6 dark:bg-slate-900/50 bg-white/50 border dark:border-white/5 border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 dark:text-orange-400">
              <Sun size={20} />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Харагдац</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                theme === "light" 
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" 
                  : "border-transparent bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10"
              )}
            >
              <Sun size={24} className={theme === "light" ? "text-indigo-500" : "text-slate-500 dark:text-slate-400"} />
              <span className="text-sm font-medium dark:text-slate-300 text-slate-700">Light</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                theme === "dark" 
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" 
                  : "border-transparent bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10"
              )}
            >
              <Moon size={24} className={theme === "dark" ? "text-indigo-400" : "text-slate-500 dark:text-slate-400"} />
              <span className="text-sm font-medium dark:text-slate-300 text-slate-700">Dark</span>
            </button>
            <button
              onClick={() => setTheme("system")}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                theme === "system" 
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" 
                  : "border-transparent bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10"
              )}
            >
              <Monitor size={24} className={theme === "system" ? "text-indigo-500 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"} />
              <span className="text-sm font-medium dark:text-slate-300 text-slate-700">Төхөөрөмж</span>
            </button>
          </div>
        </div>
      </div>

      {/* Side Info Cards */}
      <div className="space-y-6">
        <div className="glass-card p-6 dark:bg-slate-900/50 bg-white/50 border dark:border-white/5 border-slate-200">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
               <CreditCard size={20} />
             </div>
             <h3 className="font-semibold text-slate-800 dark:text-white">Багцын төлөв</h3>
           </div>
           <div className="space-y-3">
             <div className="flex justify-between items-center text-sm">
               <span className="text-slate-500 dark:text-slate-400">Идэвхитэй багц:</span>
               <span className="font-bold text-slate-800 dark:text-white uppercase">{user.plan}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
               <span className="text-slate-500 dark:text-slate-400">Дуусах хугацаа:</span>
               <span className="font-medium text-slate-800 dark:text-white">{user.planExpireDate || "—"}</span>
             </div>
           </div>
        </div>

        <div className="glass-card p-6 dark:bg-slate-900/50 bg-white/50 border dark:border-white/5 border-slate-200">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500 dark:text-sky-400">
               <Smartphone size={20} />
             </div>
             <h3 className="font-semibold text-slate-800 dark:text-white">Төхөөрөмж</h3>
           </div>
           <div className="flex items-end justify-between">
             <div className="text-3xl font-bold text-slate-800 dark:text-white">
               {user.devicesCount} <span className="text-lg text-slate-400 font-normal">/ {user.maxDevices}</span>
             </div>
           </div>
           <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
             Холбогдсон төхөөрөмжүүдийн тоо
           </p>
        </div>
      </div>
    </div>
  );
}
