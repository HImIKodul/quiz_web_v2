"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, AlertCircle, Lock, Ghost } from "lucide-react";

interface AntiCheatOverlayProps {
  isVisible: boolean;
  violationCount: number;
  isLocked: boolean;
  maxViolations: number;
}

export default function AntiCheatOverlay({ 
  isVisible, 
  violationCount, 
  isLocked, 
  maxViolations 
}: AntiCheatOverlayProps) {
  const warningsLeft = maxViolations - violationCount;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-950/90 flex flex-col items-center justify-center text-center p-6 backdrop-blur-3xl"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`glass-card p-12 max-w-lg space-y-6 border-b-4 transition-colors duration-500 ${
              isLocked 
                ? "border-red-600 bg-red-950/20 shadow-red-600/20" 
                : "border-amber-500 bg-slate-900/50 shadow-amber-500/10"
            } shadow-2xl`}
          >
            <div className="flex justify-center">
               <div className={`p-5 rounded-full ${isLocked ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"} animate-pulse`}>
                  {isLocked ? <Lock size={64} /> : <ShieldAlert size={64} />}
               </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                {isLocked ? "Хандалт хаагдлаа" : "Дэлгэц амжилттай хаагдлаа"}
              </h2>
              <div className="flex flex-col items-center gap-1">
                <p className={`${isLocked ? "text-red-500" : "text-amber-400"} font-bold flex items-center justify-center gap-2 text-sm`}>
                  <AlertCircle size={16} /> {isLocked ? "Дүрмийн зөрчил дээд хязгаарт хүрсэн" : "Сэжигтэй үйлдэл илэрлээ"}
                </p>
                {!isLocked && (
                  <div className="mt-2 flex gap-1">
                    {[...Array(maxViolations)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                          i < violationCount ? "bg-red-500" : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <p className="text-slate-400 leading-relaxed text-sm">
              {isLocked 
                ? "Та шалгалтын дүрмийг дахин дахин зөрчсөн тул систем автоматаар хаагдлаа. Админтай холбогдоно уу."
                : "Асуултын нууцлалыг хадгалах үүднээс дэлгэц авахаас сэргийлдэг. Та шалгалтандаа анхаарлаа төвлөрүүлж, өөр цонх руу шилжихгүй байхыг хүсье."}
            </p>

            <div className="pt-6">
              {!isLocked ? (
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-medium text-xs">
                  {warningsLeft > 0 
                    ? `Танд ${warningsLeft} боломж үлдлээ. Үргэлжлүүлэхийн тулд дарна уу.` 
                    : "Дараагийн зөрчил дээр систем хаагдах болно."}
                </div>
              ) : (
                <button 
                  onClick={() => window.location.reload()}
                  className="px-8 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30"
                >
                  Дахин ачааллах
                </button>
              )}
            </div>
            
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2">
              <Ghost size={12} /> Security Protocol Active • MATA Assessment
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
