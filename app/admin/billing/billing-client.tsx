"use client";

import { useTransition, useState } from "react";
import type { PaymentRequest, User } from "@prisma/client";
import { 
  CreditCard, 
  Check, 
  X,
  Loader2,
  AlertCircle
} from "lucide-react";
import { approvePaymentRequest, rejectPaymentRequest } from "@/lib/actions/payment";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type PendingPaymentRequest = PaymentRequest & {
  user: Pick<User, "identifier" | "name">;
};

export default function BillingAdminClient({ 
  pendingRequests 
}: { 
  pendingRequests: PendingPaymentRequest[] 
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmingId, setConfirmingId] = useState<{ id: number; action: "approve" | "reject" } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    setError(null);
    startTransition(async () => {
      try {
        if (action === "approve") {
          await approvePaymentRequest(id);
        } else {
          await rejectPaymentRequest(id);
        }
        setConfirmingId(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
           <CreditCard size={20} className="text-indigo-400" /> Төлбөрийн хүсэлтүүд
        </h3>
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/20">
            <AlertCircle size={14} /> {error}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {pendingRequests.length > 0 ? (
          pendingRequests.map((req) => (
            <div key={req.id} className={cn(
              "glass-card p-5 flex items-center justify-between group transition-all",
              confirmingId?.id === req.id && "ring-2 ring-indigo-500/50 bg-indigo-500/5"
            )}>
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold border border-white/5">
                  {req.user.name[0]}
                </div>
                <div>
                  <p className="font-bold text-white">{req.user.name}</p>
                  <p className="text-xs text-slate-500">{req.user.identifier} • {req.requestedPlan.toUpperCase()} багц</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {confirmingId?.id === req.id ? (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">
                      {confirmingId.action === "approve" ? "Баталгаажуулах уу?" : "Цуцлах уу?"}
                    </span>
                    <button
                      onClick={() => handleAction(req.id, confirmingId.action)}
                      disabled={isPending}
                      className={cn(
                        "h-9 px-4 rounded-lg font-bold text-xs transition-all flex items-center gap-2",
                        confirmingId.action === "approve" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                      )}
                    >
                      {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Тийм
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      disabled={isPending}
                      className="h-9 px-4 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
                    >
                      Үгүй
                    </button>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => setConfirmingId({ id: req.id, action: "approve" })}
                      disabled={isPending}
                      title="Батлах"
                      className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                    >
                      <Check size={18} />
                    </button>
                    <button 
                      onClick={() => setConfirmingId({ id: req.id, action: "reject" })}
                      disabled={isPending}
                      title="Цуцлах"
                      className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                    >
                      <X size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-12 text-center text-slate-500 bg-white/[0.02] border-dashed">
            Шинэ хүсэлт байхгүй байна.
          </div>
        )}
      </div>
    </div>
  );
}
