"use client";

import { useState, useRef } from "react";
import { FileSpreadsheet, Download, Loader2, CheckCircle2 } from "lucide-react";
import { importQuestionsAction } from "@/lib/actions/import-actions";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function BulkImportButton() {
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await importQuestionsAction(formData);
      setResult(res);
      router.refresh();
      
      // Clear result after 5 seconds
      setTimeout(() => setResult(null), 5000);
    } catch (err) {
      alert("Import failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadTemplate =() => {
    window.open("/api/admin/xlsx-template", "_blank");
  };

  return (
    <div className="relative flex items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx"
        className="hidden"
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 font-semibold hover:bg-emerald-500/20 transition-all disabled:opacity-50"
      >
        {isImporting ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <FileSpreadsheet size={18} /> 
        )}
        {isImporting ? "Түр хүлээнэ үү..." : "Excel-ээр оруулах"}
      </button>

      <button
        onClick={downloadTemplate}
        title="Загвар татах"
        className="p-2 bg-slate-800 text-slate-400 rounded-lg border border-white/5 hover:text-white transition-all"
      >
        <Download size={18} />
      </button>

      {/* Result Notification Popup */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-full mt-4 right-0 z-50 w-72 glass-card p-4 shadow-2xl border border-white/10"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                <CheckCircle2 size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Импорт амжилттай</p>
                <div className="text-xs text-slate-400 space-y-1">
                  <p>✅ {result.imported} асуулт нэмэгдсэн</p>
                  {result.skipped > 0 && (
                    <p className="text-amber-400/80">⚠️ {result.skipped} мөр алгассан</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
