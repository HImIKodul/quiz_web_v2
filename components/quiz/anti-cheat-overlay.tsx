"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, AlertCircle } from "lucide-react";

interface AntiCheatOverlayProps {
  isVisible: boolean;
}

export default function AntiCheatOverlay({ isVisible }: AntiCheatOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center text-center p-6 backdrop-blur-3xl"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-12 max-w-lg space-y-6 border-red-500/20 bg-red-500/5 shadow-2xl shadow-red-500/10"
          >
            <div className="flex justify-center">
               <div className="p-5 rounded-full bg-red-500/10 text-red-500 animate-pulse">
                  <ShieldAlert size={64} />
               </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">Дэлгэц амжилттай хаагдлаа</h2>
              <p className="text-red-400 font-bold flex items-center justify-center gap-2">
                <AlertCircle size={18} /> Сэжигтэй үйлдэл илэрлээ
              </p>
            </div>

            <p className="text-slate-400 leading-relaxed">
              Асуултын нууцлалыг хадгалах үүднээс дэлгэц авахаас сэргийлдэг. 
              Та шалгалтандаа анхаарлаа төвлөрүүлж, өөр цонх руу шилжихгүй байхыг хүсье.
            </p>

            <div className="pt-6">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-slate-300 font-medium text-sm">
                Үргэлжлүүлэхийн тулд энэ цонх дээр дарна уу
              </div>
            </div>
            
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
              Security Active • MATA Assessment System
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
