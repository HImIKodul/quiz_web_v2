"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { 
  ArrowLeft, 
  CheckCircle2, 
  CreditCard, 
  Smartphone, 
  Building2,
  Info
} from "lucide-react";
import Link from "next/link";
import { submitPaymentRequest } from "@/lib/actions/payment";
import { useSession } from "next-auth/react";

export default function PaymentPage({ params }: { params: Promise<{ plan: string }> }) {
  const { plan } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const identifier = session?.user?.identifier ?? session?.user?.email ?? "";

  const planName = plan === "plus" ? "PLUS" : "PRO";
  const amount = plan === "plus" ? "5,000₮" : "10,000₮";

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitPaymentRequest(plan);
      alert("Таны хүсэлтийг хүлээж авлаа. Админ шалгаж баталгаажуулсны дараа багц идэвхжих болно.");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/subscriptions"
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Төлбөр шилжүүлэх</h1>
            <p className="text-slate-400 mt-1">{planName} багцыг идэвхжүүлэх заавар</p>
          </div>
        </div>

        <div className="glass-card p-8 space-y-8 border-indigo-500/20 bg-indigo-500/5">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
            <Info className="shrink-0" size={24} />
            <p className="text-sm leading-relaxed">
              <span className="font-bold">АНХААР:</span> Гүйлгээний утга дээр өөрийн бүртгэлтэй утасны дугаараа 
              <span className="font-black text-white px-1">({identifier})</span> 
              заавал бичнэ үү!
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-4">
                 <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Building2 size={24} />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Хүлээн авагч банк</p>
                    <p className="text-lg font-bold text-white">[Банкны нэр]</p>
                 </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-4">
                 <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <CreditCard size={24} />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Дансны дугаар</p>
                    <p className="text-lg font-mono font-bold text-white">0000000000</p>
                 </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-4">
                 <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                    <Smartphone size={24} />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Гүйлгээний утга (Утасны дугаар)</p>
                    <p className="text-lg font-bold text-white">{identifier}</p>
                 </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5">
               <div className="flex items-center justify-between mb-8">
                  <span className="text-slate-400 font-medium">Шилжүүлэх дүн</span>
                  <span className="text-3xl font-black text-white">{amount}</span>
               </div>

               <button 
                 onClick={handleSubmit}
                 disabled={loading}
                 className={`w-full premium-gradient py-5 rounded-2xl text-white font-black text-lg shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
               >
                 {loading ? (
                   "Боловсруулж байна..."
                 ) : (
                   <>
                     <CheckCircle2 size={24} />
                     Би төлбөр төлсөн
                   </>
                 )}
               </button>
               <p className="text-center text-[11px] text-slate-500 mt-4 uppercase tracking-widest font-bold">
                 Төлбөрийг 5-30 минутын дотор админ баталгаажуулна.
               </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
