"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  AlertCircle,
  Check
} from "lucide-react";
import type { Question } from "@prisma/client";
import { cn } from "@/lib/utils";
import AntiCheatGuard from "@/components/quiz/anti-cheat-guard";
import MatchingInput from "@/components/quiz/matching-input";

type QuizQuestion = Pick<
  Question,
  | "id"
  | "qType"
  | "questionText"
  | "optionA"
  | "optionB"
  | "optionC"
  | "optionD"
  | "optionE"
  | "optionF"
  | "correctAnswer"
  | "imageFilename"
  | "topic"
>;

const OPTION_KEYS = ["optionA", "optionB", "optionC", "optionD", "optionE", "optionF"] as const;

export default function QuizSession({ 
  questions, 
  initialTimer 
}: { 
  questions: QuizQuestion[]; 
  initialTimer: number; 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(initialTimer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const [randomSeed] = useState(() => Math.random());

  // Shuffling logic using stable randomSeed to satisfy purity rules
  const { shuffledQuestions, optionOrderMap } = useMemo(() => {
    // 1. Shuffle Questions using the seed
    const ordered = [...questions];
    // Simple deterministic pseudo-random shuffle using the mount-time seed
    // We can use the index as extra entropy
    ordered.sort((a, b) => {
      const hash = (id: number) => {
        let h = id * randomSeed;
        h = ((h >> 16) ^ h) * 0x45d9f3b;
        h = ((h >> 16) ^ h) * 0x45d9f3b;
        h = (h >> 16) ^ h;
        return h;
      };
      return hash(a.id) - hash(b.id);
    });

    // 2. Shuffle Options for each question
    const orderMap: Record<number, typeof OPTION_KEYS[number][]> = {};
    ordered.forEach(q => {
      const validOptions = [...OPTION_KEYS.filter(key => !!q[key])];
      validOptions.sort((a, b) => {
        const hash = (str: string) => {
          let h = 0;
          for(let i=0; i<str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
          return (h * randomSeed) % 1;
        };
        return hash(a) - hash(b);
      });
      orderMap[q.id] = validOptions;
    });

    return { shuffledQuestions: ordered, optionOrderMap: orderMap };
  }, [questions, randomSeed]);

  const currentQuestion = shuffledQuestions[currentIndex];
  const progress =
    shuffledQuestions.length > 0
      ? ((currentIndex + 1) / shuffledQuestions.length) * 100
      : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (answer: string) => {
    if (!currentQuestion) {
      return;
    }

    if (currentQuestion.qType === "multi_select") {
      setAnswers((prev) => {
        const currentAnswers = prev[currentQuestion.id] ? prev[currentQuestion.id].split(",").filter(Boolean) : [];
        const index = currentAnswers.indexOf(answer);
        let newAnswers;
        if (index > -1) {
          newAnswers = currentAnswers.filter((a) => a !== answer);
        } else {
          newAnswers = [...currentAnswers, answer].sort();
        }
        return {
          ...prev,
          [currentQuestion.id]: newAnswers.join(","),
        };
      });
    } else {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: answer,
      }));
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!shuffledQuestions?.length) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          questions: shuffledQuestions.map((q) => ({
            id: q.id,
            questionText: q.questionText,
            topic: q.topic,
            correctAnswer: q.correctAnswer,
          })),
        }),
      });

      const result = await response.json();
      if (response.ok) {
        router.push(`/result/${result.attemptId}`);
      } else {
        alert("Хариулт хадгалахад алдаа гарлаа.");
      }
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, shuffledQuestions, router]);

  // Timer logic
  useEffect(() => {
    if (!shuffledQuestions) return;
    if (initialTimer === 0) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [handleSubmit, initialTimer, shuffledQuestions, timeLeft]);

  if (!shuffledQuestions) {
    return <div className="min-h-[60vh]" />;
  }

  if (shuffledQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle className="text-slate-500" size={48} />
        <h2 className="text-xl text-white">Асуулт олдсонгүй.</h2>
        <button onClick={() => router.back()} className="text-primary">Буцах</button>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="min-h-[60vh]" />;
  }

  return (
    <AntiCheatGuard onViolationLimitReached={handleSubmit}>
      <div className="max-w-4xl mx-auto space-y-8">
      {/* Header with Stats */}
      <div className="flex items-center justify-between glass-card p-6 sticky top-4 z-10 backdrop-blur-2xl">
        <div className="flex items-center gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Асуулт</span>
            <p className="text-xl font-bold text-white tracking-tighter">
              {currentIndex + 1} <span className="text-slate-600">/</span> {shuffledQuestions.length}
            </p>
          </div>
          {initialTimer > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Хугацаа</span>
              <div className={cn(
                "flex items-center gap-2 text-xl font-bold tracking-tighter tabular-nums",
                timeLeft < 60 ? "text-red-400 animate-pulse" : "text-emerald-400"
              )}>
                <Clock size={20} />
                {formatTime(timeLeft)}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="premium-gradient flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all disabled:opacity-50"
        >
          {isSubmitting ? "Хадгалж байна..." : "Дуусгах"} <Send size={18} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full premium-gradient"
        />
      </div>

      {/* Question Section */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          <div className="glass-card p-8 md:p-12 space-y-6">
            {currentQuestion.topic && (
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                {currentQuestion.topic}
              </span>
            )}
            <h2 className="text-2xl md:text-3xl font-medium text-white leading-relaxed">
              {currentQuestion.questionText}
            </h2>

            {currentQuestion.imageFilename && (
              <div className="rounded-2xl overflow-hidden border border-white/5 max-w-2xl">
                <Image
                  src={`/uploads/${currentQuestion.imageFilename}`} 
                  alt="Question" 
                  width={1200}
                  height={675}
                  unoptimized
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.qType === "mcq" && (optionOrderMap[currentQuestion.id] || []).map((optKey) => {
              const optionText = currentQuestion[optKey];
              const optionLetter = optKey.slice(-1);
              const isSelected = answers[currentQuestion.id] === optionLetter;

              return (
                <button
                  key={optKey}
                  onClick={() => handleAnswer(optionLetter)}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-2xl border transition-all text-left group",
                    isSelected 
                      ? "bg-primary border-primary text-white shadow-xl shadow-primary/20" 
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 flex items-center justify-center rounded-xl font-bold transition-colors",
                    isSelected ? "bg-white/20 text-white" : "bg-slate-800 text-slate-500 group-hover:bg-slate-700"
                  )}>
                    {optionLetter}
                  </div>
                  <span className="flex-1 font-medium">{optionText}</span>
                </button>
              );
            })}

            {currentQuestion.qType === "tf" && (
              <div className="grid grid-cols-2 gap-4">
                {["True", "False"].map((v) => {
                  const isSelected = answers[currentQuestion.id] === v;
                  return (
                    <button
                      key={v}
                      onClick={() => handleAnswer(v)}
                      className={cn(
                        "p-8 rounded-2xl border text-center transition-all group",
                        isSelected
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                      )}
                    >
                      <span className="text-xl font-bold">{v === "True" ? "Үнэн" : "Худал"}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQuestion.qType === "numeric" && (
              <div className="glass-card p-6">
                <input
                  type="text"
                  placeholder="Хариултаа оруулна уу..."
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswer(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-6 text-2xl text-center text-white focus:border-indigo-500 outline-none transition-all font-mono"
                />
              </div>
            )}

            {currentQuestion.qType === "multi_select" && (optionOrderMap[currentQuestion.id] || []).map((optKey) => {
              const optionText = currentQuestion[optKey];
              const optionLetter = optKey.slice(-1);
              const isSelected = answers[currentQuestion.id]?.split(",").includes(optionLetter);

              return (
                <button
                  key={optKey}
                  onClick={() => handleAnswer(optionLetter)}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-2xl border transition-all text-left group",
                    isSelected 
                      ? "bg-indigo-500/20 border-indigo-500 text-indigo-400" 
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50"
                  )}
                >
                  <div className={cn(
                    "h-6 w-6 flex items-center justify-center rounded border transition-colors",
                    isSelected ? "bg-indigo-500 border-indigo-500 text-white" : "bg-slate-800 border-slate-700"
                  )}>
                    {isSelected && <Check size={14} />}
                  </div>
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl font-bold bg-slate-800/50 text-slate-500">
                    {optionLetter}
                  </div>
                  <span className="flex-1 font-medium">{optionText}</span>
                </button>
              );
            })}

            {currentQuestion.qType === "matching" && (
              <div className="glass-card p-8">
                <MatchingInput
                  correctAnswer={currentQuestion.correctAnswer}
                  value={answers[currentQuestion.id] || ""}
                  onChange={(val) => handleAnswer(val)}
                />
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between py-10">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/5 text-slate-400 hover:bg-white/5 disabled:opacity-0 transition-all font-semibold"
        >
          <ChevronLeft size={20} /> Өмнөх
        </button>
        <button
          onClick={() => {
            if (currentIndex < shuffledQuestions.length - 1) {
              setCurrentIndex(currentIndex + 1);
            } else {
              handleSubmit();
            }
          }}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition-all active:scale-95 shadow-lg"
        >
          {currentIndex === shuffledQuestions.length - 1 ? "Дуусгах" : "Дараах"} 
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
    </AntiCheatGuard>
  );
}

