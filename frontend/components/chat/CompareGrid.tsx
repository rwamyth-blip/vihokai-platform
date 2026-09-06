"use client";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, Check, Loader2, Trophy } from "lucide-react";

type AnswerMap = Record<string, string>;
interface Props {
  question: string;
  allAnswers: AnswerMap;
  finalAnswer?: string;
  judgeBy?: string;
  mode: "compare" | "synthesize" | "single";
  loadingAIs?: string[];
}
const AI_CONFIG: Record<string, any> = {
  chatgpt: { color: "border-green-500/50 bg-green-500/10", icon: "🤖", name: "ChatGPT" },
  gemini: { color: "border-blue-500/50 bg-blue-500/10", icon: "✨", name: "Gemini" },
  deepseek: { color: "border-purple-500/50 bg-purple-500/10", icon: "🧠", name: "DeepSeek" },
  kimi: { color: "border-orange-500/50 bg-orange-500/10", icon: "🌙", name: "Kimi" },
  meta_ai: { color: "border-cyan-400/50 bg-cyan-400/10 ring-1 ring-cyan-400/20", icon: "🦙", name: "Meta AI" },
};
function AICard({ aiKey, answer, isLoading }: any) {
  const config = AI_CONFIG[aiKey] || { color: "", icon: "🤖", name: aiKey };
  return (
    <div className={`rounded-2xl border backdrop-blur p-4 flex flex-col h-[380px] ${config.color}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><span className="text-xl">{config.icon}</span><h3 className="font-semibold text-sm">{config.name}</h3></div>
        {isLoading? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-green-500" />}
      </div>
      <div className="flex-1 overflow-y-auto text-[13px] leading-relaxed prose prose-invert prose-sm max-w-none">
        {isLoading? <div className="space-y-2 animate-pulse"><div className="h-3 bg-white/10 rounded w-3/4"></div><div className="h-3 bg-white/10 rounded w-full"></div></div> : <ReactMarkdown>{answer || ""}</ReactMarkdown>}
      </div>
    </div>
  );
}
export default function CompareGrid({ allAnswers, finalAnswer, judgeBy, mode, loadingAIs = [] }: Props) {
  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Object.keys(AI_CONFIG).map((key) => (
          <AICard key={key} aiKey={key} answer={allAnswers?.[key]} isLoading={loadingAIs.includes(key)} />
        ))}
      </div>
      <AnimatePresence>
        {mode === "synthesize" && finalAnswer && (
          // @ts-ignore -- framer-motion type conflict with React 19 types
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-[20px] border border-yellow-500/30 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-yellow-500/20"><Trophy className="w-5 h-5 text-yellow-400" /></div>
              <div><h2 className="font-bold flex items-center gap-2">BEST ANSWER <span className="text-yellow-400">SYNTHESIZED</span><Sparkles className="w-4 h-4 text-yellow-400" /></h2><p className="text-xs text-zinc-400 flex items-center gap-1"><Brain className="w-3 h-3" /> Judge by {judgeBy}</p></div>
            </div>
            <div className="prose prose-invert max-w-none"><ReactMarkdown>{finalAnswer}</ReactMarkdown></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
