import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Award } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function ResultReplayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const attemptId = parseInt(id);
  
  if (isNaN(attemptId)) notFound();

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      details: true,
    },
  });

  if (!attempt || attempt.userId !== parseInt(session.user.id)) {
    notFound();
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Шалгалтын дүн</h1>
            <p className="text-slate-400 mt-1">{format(new Date(attempt.timestamp), "yyyy/MM/dd HH:mm")} — ID: #{attempt.id}</p>
          </div>
        </div>

        {/* Stats Header */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
           <div className="glass-card p-6 flex flex-col items-center justify-center border-emerald-500/20 bg-emerald-500/5">
              <Award size={24} className="text-emerald-400 mb-2" />
              <div className="text-3xl font-black text-white">{attempt.scorePercent}%</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Оноо</div>
           </div>
           <div className="glass-card p-6 flex flex-col items-center justify-center border-indigo-500/20 bg-indigo-500/5">
              <div className="text-3xl font-black text-white">{attempt.correctAnswers}/{attempt.totalQuestions}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Зөв хариулт</div>
           </div>
           <div className="glass-card p-6 flex flex-col items-center justify-center border-white/5 bg-white/5">
              <Clock size={24} className="text-slate-400 mb-2" />
              <div className="text-xl font-bold text-white">Дуусгасан</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Төлөв</div>
           </div>
        </div>

        <div className="space-y-6">
           <h3 className="text-xl font-bold text-white">Асуултуудын дэлгэрэнгүй</h3>
           {attempt.details.map((detail, index) => (
             <div key={detail.id} className={`glass-card p-6 space-y-4 border-l-4 transition-all hover:bg-white/5 ${detail.isCorrect ? "border-emerald-500" : "border-red-500"}`}>
                <div className="flex items-start justify-between gap-4">
                   <div className="space-y-2">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Question {index + 1}</span>
                         {detail.topic && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 uppercase">
                              {detail.topic}
                            </span>
                         )}
                      </div>
                      <p className="text-white font-medium leading-relaxed">{detail.questionText}</p>
                   </div>
                   <div className="shrink-0">
                      {detail.isCorrect ? (
                        <CheckCircle2 className="text-emerald-500" size={24} />
                      ) : (
                        <XCircle className="text-red-500" size={24} />
                      )}
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Таны хариулт</p>
                      <p className={`text-sm font-bold ${detail.isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                        {detail.userAnswer || "Хариулаагүй"}
                      </p>
                   </div>
                   {!detail.isCorrect && (
                     <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Зөв хариулт</p>
                        <p className="text-sm font-bold text-emerald-400">
                          {detail.correctAnswer}
                        </p>
                     </div>
                   )}
                </div>
             </div>
           ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
