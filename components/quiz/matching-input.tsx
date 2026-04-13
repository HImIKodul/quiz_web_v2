"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MatchingInputProps {
  correctAnswer: string;
  value: string; // "A=B|C=D"
  onChange: (value: string) => void;
  disabled?: boolean;
  showCorrect?: boolean;
}

export default function MatchingInput({
  correctAnswer,
  value,
  onChange,
  disabled,
  showCorrect
}: MatchingInputProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; id: string }[]>([]);

  // Parse pairs from "A=B|C=D"
  const parsePairs = (str: string) => {
    if (!str || typeof str !== 'string') return [];
    return str.split("|").filter(Boolean).map(pair => {
      const parts = pair.split("=");
      return { 
        left: parts[0]?.trim() || "", 
        right: parts[1]?.trim() || "" 
      };
    }).filter(p => p.left || p.right);
  };

  const [randomSeed] = useState(() => Math.random());
  const currentPairs = useMemo(() => parsePairs(value), [value]);
  const correctPairs = useMemo(() => parsePairs(correctAnswer), [correctAnswer]);

  const { leftItems, rightItems } = useMemo(() => {
    const pairs = parsePairs(correctAnswer);
    const lefts = Array.from(new Set(pairs.map(p => p.left))).filter(Boolean);
    const rights = Array.from(new Set(pairs.map(p => p.right))).filter(Boolean);
    
    // Stable shuffle based on the mount-time randomSeed
    const shuffledRights = [...rights].sort((a, b) => {
      const pseudoRandom = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = (hash << 5) - hash + str.charCodeAt(i);
          hash |= 0;
        }
        return Math.abs(hash * randomSeed) % 1;
      };
      return pseudoRandom(a) - pseudoRandom(b);
    });

    return { leftItems: lefts, rightItems: shuffledRights };
  }, [correctAnswer, randomSeed]);

  // Accurate line calculation
  useLayoutEffect(() => {
    const updateLines = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      
      const newLines = currentPairs.map(pair => {
        const leftEl = leftRefs.current[pair.left];
        const rightEl = rightRefs.current[pair.right];
        
        if (!leftEl || !rightEl) return null;
        
        const leftRect = leftEl.getBoundingClientRect();
        const rightRect = rightEl.getBoundingClientRect();
        
        return {
          id: `${pair.left}-${pair.right}`,
          x1: leftRect.right - containerRect.left,
          y1: leftRect.top + leftRect.height / 2 - containerRect.top,
          x2: rightRect.left - containerRect.left,
          y2: rightRect.top + rightRect.height / 2 - containerRect.top
        };
      }).filter((l): l is NonNullable<typeof l> => !!l);
      
      setLines(newLines);
    };

    updateLines();
    window.addEventListener("resize", updateLines);
    return () => window.removeEventListener("resize", updateLines);
  }, [currentPairs, leftItems, rightItems]);

  const handleSelectItem = (item: string, side: "left" | "right") => {
    if (disabled) return;

    if (side === "left") {
      setSelectedLeft(selectedLeft === item ? null : item);
    } else {
      if (selectedLeft) {
        // Remove existing matches for this left or right item
        const newPairs = currentPairs.filter(p => p.left !== selectedLeft && p.right !== item);
        newPairs.push({ left: selectedLeft, right: item });
        
        const newValue = newPairs
          .sort((a, b) => a.left.localeCompare(b.left))
          .map(p => `${p.left}=${p.right}`)
          .join("|");
        
        onChange(newValue);
        setSelectedLeft(null);
      }
    }
  };

  const removePair = (left: string) => {
    if (disabled) return;
    const newValue = currentPairs
      .filter(p => p.left !== left)
      .sort((a, b) => a.left.localeCompare(b.left))
      .map(p => `${p.left}=${p.right}`)
      .join("|");
    onChange(newValue);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto" ref={containerRef}>
      <div className="grid grid-cols-2 gap-12 md:gap-24 relative p-4">
        {/* SVG layer for lines */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full z-0 overflow-visible">
          {lines.map((line) => (
            <motion.line
              key={line.id}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="currentColor"
              strokeWidth="3"
              className="text-primary/40"
              strokeLinecap="round"
              strokeDasharray="6 4"
            />
          ))}
        </svg>

        {/* Left Column */}
        <div className="space-y-4 z-10">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center mb-6">Асуулт</p>
          {leftItems.map((item, idx) => {
            const isMatched = currentPairs.some(p => p.left === item);
            const isSelected = selectedLeft === item;
            
            return (
              <button
                key={`left-${idx}-${item}`}
                ref={el => { leftRefs.current[item] = el; }}
                onClick={() => handleSelectItem(item, "left")}
                disabled={disabled}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all duration-300 text-sm font-bold min-h-[64px] flex items-center justify-center text-center",
                  isSelected 
                    ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105" 
                    : isMatched 
                      ? "bg-slate-900/50 border-primary/30 text-primary-light" 
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-800"
                )}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="space-y-4 z-10">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center mb-6">Хариулт</p>
          {rightItems.map((item, idx) => {
            const isMatched = currentPairs.some(p => p.right === item);
            
            return (
              <button
                key={`right-${idx}-${item}`}
                ref={el => { rightRefs.current[item] = el; }}
                onClick={() => handleSelectItem(item, "right")}
                disabled={disabled}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all duration-300 text-sm font-bold min-h-[64px] flex items-center justify-center text-center",
                  isMatched 
                    ? "bg-slate-900/50 border-primary/30 text-primary-light" 
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-800"
                )}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {currentPairs.length > 0 && !disabled && (
        <div className="flex flex-wrap gap-2 pt-6 border-t border-white/5">
          {currentPairs.map((pair, idx) => (
            <button
              key={`match-${idx}`}
              onClick={() => removePair(pair.left)}
              className="px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary-light text-xs flex items-center gap-3 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all group animate-in fade-in slide-in-from-bottom-2"
            >
              <span className="font-bold opacity-70">{idx + 1}.</span>
              {pair.left} — {pair.right}
              <span className="text-lg leading-none opacity-40 group-hover:opacity-100">×</span>
            </button>
          ))}
        </div>
      )}

      {showCorrect && (
        <div className="mt-8 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-4">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-center">Зөв хослолууд:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {correctPairs.map((pair, idx) => (
              <div key={`correct-${idx}`} className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-3">
                <span className="h-5 w-5 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]">✓</span>
                {pair.left} = {pair.right}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
