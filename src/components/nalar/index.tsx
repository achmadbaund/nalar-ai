"use client";

import { motion } from "framer-motion";

interface NalarAvatarProps {
  isAnalyzing?: boolean;
  isThinking?: boolean;
  message?: string;
}

export default function NalarAvatar({ isAnalyzing, isThinking, message }: NalarAvatarProps) {
  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-gradient-to-b from-primary/5 to-transparent rounded-lg">
      {/* Avatar Container */}
      <div className="relative">
        <motion.div
          animate={
            isAnalyzing
              ? { scale: [1, 1.05, 1], transition: { duration: 1, repeat: Infinity } }
              : isThinking
              ? { y: [0, -5, 0], transition: { duration: 2, repeat: Infinity } }
              : { scale: [1, 1.02, 1], transition: { duration: 3, repeat: Infinity } }
          }
          className="relative"
        >
          {/* Avatar Image */}
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg">
            <img src="/avatar.png" alt="Nalar AI" className="w-full h-full object-cover" />
          </div>

          {/* Status Ring */}
          {isAnalyzing && (
            <motion.div
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.3, opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-4 border-primary"
            />
          )}

          {/* Thinking indicator */}
          {isThinking && (
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Name Badge */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold shadow-md">
          NALAR
        </div>
      </div>

      {/* Message Bubble */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted rounded-xl px-4 py-2 max-w-[280px] text-center"
        >
          <p className="text-sm text-muted-foreground">{message}</p>
        </motion.div>
      )}

      {/* Status Text */}
      <div className="text-center">
        <p className="text-xs font-medium text-primary">
          {isAnalyzing ? "Menganalisis..." : isThinking ? "Berpikir..." : "AI Sentiment Analyst"}
        </p>
        <p className="text-[10px] text-muted-foreground">Powered by IndoBERT</p>
      </div>
    </div>
  );
}
