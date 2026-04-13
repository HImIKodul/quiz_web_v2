"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle,
  Eye,
  Info,
  X,
  Lightbulb,
  Sparkles
} from "lucide-react";
import type { Question } from "@prisma/client";
import { cn } from "@/lib/utils";
import AntiCheatGuard from "@/components/quiz/anti-cheat-guard";
import MatchingInput from "@/components/quiz/matching-input";

type StudyQuestion = Pick<
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
  | "explanation"
  | "imageFilename"
>;

const OPTION_KEYS = ["optionA", "optionB", "optionC", "optionD", "optionE", "optionF"] as const;

export default function StudySession({ questions }: { questions: StudyQuestion[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const router = useRouter();

  const [randomSeed] = useState(() => Math.random());

  const playBeep = (isCorrect: boolean) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (isCorrect) {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1); // C6
      } else {
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
      }
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch(e) {
      console.error("Audio play failed:", e);
    }
  };

  const getHint = async () => {
    if (hint || hintLoading) return;
    setHintLoading(true);
    try {
      const res = await fetch("/api/ai/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: currentQuestion.id }),
      });
      const data = await res.json();
      if (data.hint) {
        setHint(data.hint);
      } else {
        setHint("Энэ асуултад санамж олдсонгүй.");
      }
    } catch {
      setHint("Санамж ачааллахад алдаа гарлаа.");
    } finally {
      setHintLoading(false);
    }
  };

  // Shuffling logic using stable randomSeed to satisfy purity rules
  const { shuffledQuestions, optionOrderMap } = useMemo(() => {
    // 1. Shuffle Questions using the seed
    const ordered = [...questions];
    ordered.sort((a, b) => {
      const hash = (id: number) => {
        let h = (id || 0) * randomSeed;
        h = ((h >> 16) ^ h) * 0x45d9f3b;
        return h % 1;
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
      orderMap[q.id || 0] = validOptions;
    });

    return { shuffledQuestions: ordered, optionOrderMap: orderMap };
  }, [questions, randomSeed]);

  const currentQuestion = shuffledQuestions[currentIndex];
  const progress = shuffledQuestions.length > 0 ? ((currentIndex + 1) / shuffledQuestions.length) * 100 : 0;

  const handleSelect = (val: string) => {
    if (showAnswer) return;

    if (currentQuestion.qType === "multi_select") {
      const currentAnswers = selectedAnswer ? selectedAnswer.split(",").filter(Boolean) : [];
      const index = currentAnswers.indexOf(val);
      let newAnswers;
      if (index > -1) {
        newAnswers = currentAnswers.filter((a) => a !== val);
      } else {
        newAnswers = [...currentAnswers, val].sort();
      }
      setSelectedAnswer(newAnswers.join(","));
    } else {
      setSelectedAnswer(val);
    }
  };

  const checkAnswer = () => {
    setShowAnswer(true);
    
    // Evaluate if correct for sound effect
    let isCorrect = false;
    if (currentQuestion.qType === "multi_select") {
      const selectedArr = selectedAnswer ? selectedAnswer.split(",").sort() : [];
      const correctArr = currentQuestion.correctAnswer.split(",").sort();
      isCorrect = JSON.stringify(selectedArr) === JSON.stringify(correctArr);
    } else {
      isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    }
    
    playBeep(isCorrect);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setHint(null);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setHint(null);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <Info className="text-slate-500" size={48} />
        <h2 className="text-xl text-white">Энэ сэдэвт асуулт байхгүй байна.</h2>
        <button onClick={() => router.push("/study")} className="text-primary font-bold">Буцах</button>
      </div>
    );
  }

  return (
    <AntiCheatGuard>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between glass-card p-6 sticky top-4 z-10 backdrop-blur-2xl">
         <div className="flex items-center gap-4">
            <button onClick={() => router.push("/study")} className="p-2 hover:bg-white/5 rounded-lg text-slate-400">
               <X size={20} />
            </button>
            <div className="h-8 w-[1px] bg-white/10" />
            <div className="space-y-0.5">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Study Mode</span>
               <p className="text-lg font-bold text-white tracking-tighter">
                 {currentIndex + 1} <span className="text-slate-700">/</span> {questions.length}
               </p>
            </div>
         </div>
         <div className="h-2 w-32 bg-slate-900 rounded-full overflow-hidden">
            <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${progress}%` }}
               className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
            />
         </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="space-y-8"
        >
          <div className="glass-card p-8 md:p-12 space-y-6">
            <h2 className="text-2xl md:text-3xl font-medium text-white leading-relaxed">
              {currentQuestion.questionText}
            </h2>
            {currentQuestion.imageFilename && (
              <div className="rounded-2xl overflow-hidden border border-white/5 max-w-2xl mx-auto">
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
            {currentQuestion.qType === "mcq" && (optionOrderMap[currentQuestion.id || 0] || []).map((optKey) => {
              const optionText = currentQuestion[optKey];
              const letter = optKey.slice(-1);
              const isCorrect = letter === currentQuestion.correctAnswer;
              const isSelected = selectedAnswer === letter;

              let statusClasses = "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600";
              
              if (showAnswer) {
                 if (isCorrect) statusClasses = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                 else if (isSelected) statusClasses = "bg-red-500/20 border-red-500 text-red-400";
              } else if (isSelected) {
                 statusClasses = "bg-indigo-500/20 border-indigo-500 text-white";
              }

              return (
                <button
                  key={optKey}
                  onClick={() => handleSelect(letter)}
                  className={cn("flex items-center gap-4 p-5 rounded-2xl border transition-all text-left", statusClasses)}
                >
                  <div className={cn(
                    "h-10 w-10 flex items-center justify-center rounded-xl font-bold transition-all",
                    isSelected || (showAnswer && isCorrect) ? "bg-white/10" : "bg-slate-800 text-slate-500"
                  )}>
                    {letter}
                  </div>
                  <span className="flex-1 font-medium">{optionText}</span>
                  {showAnswer && isCorrect && <CheckCircle2 className="text-emerald-500" size={20} />}
                  {showAnswer && isSelected && !isCorrect && <XCircle className="text-red-500" size={20} />}
                </button>
              );
            })}

            {currentQuestion.qType === "tf" && (
              <div className="grid grid-cols-2 gap-4">
                {["True", "False"].map((v) => {
                  const isCorrect = v === currentQuestion.correctAnswer;
                  const isSelected = selectedAnswer === v;
                  
                  let statusClasses = "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800";
                  if (showAnswer) {
                    if (isCorrect) statusClasses = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                    else if (isSelected) statusClasses = "bg-red-500/20 border-red-500 text-red-400";
                  } else if (isSelected) {
                    statusClasses = "bg-indigo-500/20 border-indigo-500 text-white";
                  }

                  return (
                    <button
                      key={v}
                      onClick={() => handleSelect(v)}
                      className={cn("p-8 rounded-2xl border text-center transition-all group", statusClasses)}
                    >
                      <span className="text-xl font-bold">{v === "True" ? "Үнэн" : "Худал"}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQuestion.qType === "numeric" && (
              <div className="space-y-4">
                <div className="glass-card p-6">
                  <input
                    type="text"
                    placeholder="Хариултаа оруулна уу..."
                    value={selectedAnswer || ""}
                    onChange={(e) => handleSelect(e.target.value)}
                    disabled={showAnswer}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-6 text-2xl text-center text-white focus:border-indigo-500 outline-none transition-all font-mono"
                  />
                </div>
                {showAnswer && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center font-bold">
                    Зөв хариулт: {currentQuestion.correctAnswer}
                  </div>
                )}
              </div>
            )}

            {currentQuestion.qType === "multi_select" && (optionOrderMap[currentQuestion.id || 0] || []).map((optKey) => {
              const optionText = currentQuestion[optKey];
              const letter = optKey.slice(-1);
              const isCorrect = currentQuestion.correctAnswer.split(",").includes(letter);
              const isSelected = selectedAnswer?.split(",").includes(letter);

              let statusClasses = "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600";
              if (showAnswer) {
                if (isCorrect) statusClasses = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                else if (isSelected) statusClasses = "bg-red-500/20 border-red-500 text-red-400";
              } else if (isSelected) {
                statusClasses = "bg-indigo-500/20 border-indigo-500 text-white";
              }

              return (
                <button
                  key={optKey}
                  onClick={() => handleSelect(letter)}
                  className={cn("flex items-center gap-4 p-5 rounded-2xl border transition-all text-left", statusClasses)}
                >
                  <div className={cn(
                    "h-6 w-6 flex items-center justify-center rounded border transition-colors",
                    isSelected ? "bg-indigo-500 border-indigo-500 text-white" : "bg-slate-800 border-slate-700"
                  )}>
                    {isSelected && <CheckCircle2 size={14} />}
                  </div>
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl font-bold bg-slate-800/50 text-slate-500">
                    {letter}
                  </div>
                  <span className="flex-1 font-medium">{optionText}</span>
                  {showAnswer && isCorrect && <CheckCircle2 className="text-emerald-500" size={20} />}
                </button>
              );
            })}

            {currentQuestion.qType === "matching" && (
              <div className="glass-card p-8">
                <MatchingInput
                  correctAnswer={currentQuestion.correctAnswer}
                  value={selectedAnswer || ""}
                  onChange={(val) => handleSelect(val)}
                  disabled={showAnswer}
                  showCorrect={showAnswer}
                />
              </div>
            )}
          </div>

          {/* AI Hint Section */}
          {!showAnswer && (
            <div className="flex flex-col items-center gap-4 pt-4">
               {!hint && !hintLoading ? (
                 <button 
                   onClick={getHint}
                   className="flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-colors text-sm font-medium"
                 >
                   <Lightbulb size={16} /> Санамж авах (AI)
                 </button>
               ) : hintLoading ? (
                 <div className="flex items-center gap-2 text-orange-400/70 text-sm animate-pulse">
                   <Sparkles size={16} /> Санамж боловсруулж байна...
                 </div>
               ) : hint && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="glass-card w-full p-5 border-orange-500/20 bg-orange-500/5 relative overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                       <Lightbulb size={120} />
                    </div>
                    <div className="flex gap-4">
                       <div className="mt-1 p-2 rounded-lg bg-orange-500/10 text-orange-400 h-fit">
                         <Lightbulb size={18} />
                       </div>
                       <div>
                          <h4 className="font-semibold text-orange-400 mb-1">AI Санамж</h4>
                          <p className="text-slate-300 text-sm leading-relaxed">{hint}</p>
                       </div>
                    </div>
                 </motion.div>
               )}
            </div>
          )}

          {/* Explanation Section */}
          {showAnswer && currentQuestion.explanation && (
             <motion.div 
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: "auto" }}
               className="glass-card w-full p-6 border-indigo-500/20 bg-indigo-500/5"
             >
                <h4 className="font-semibold text-indigo-400 mb-2 flex items-center gap-2">
                   <Info size={16} /> Тайлбар:
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed mx-auto max-w-3xl">
                   {currentQuestion.explanation}
                </p>
             </motion.div>
          )}

        </motion.div>
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-xl border-t border-white/5 z-20">
         <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
               <button
                 onClick={prevQuestion}
                 disabled={currentIndex === 0}
                 className="p-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-0 transition-all"
               >
                 <ChevronLeft size={24} />
               </button>
               <button
                 onClick={nextQuestion}
                 disabled={currentIndex === questions.length - 1}
                 className="p-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 disabled:opacity-0 transition-all"
               >
                 <ChevronRight size={24} />
               </button>
            </div>

            <div className="flex items-center gap-4">
               {!showAnswer ? (
                 <button
                   onClick={checkAnswer}
                   disabled={!selectedAnswer}
                   className="px-8 py-3 bg-white text-slate-900 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 disabled:opacity-50 transition-all"
                 >
                   <Eye size={18} /> Хариулт харах
                 </button>
               ) : (
                 <button
                   onClick={nextQuestion}
                   className="px-8 py-3 premium-gradient text-white rounded-xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                 >
                   Дараагийн асуулт <ChevronRight size={18} />
                 </button>
               )}
            </div>
         </div>
      </div>
    </div>
    </AntiCheatGuard>
  );
}
