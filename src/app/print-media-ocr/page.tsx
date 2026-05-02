"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl w-full"
      >
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left Side - Nalar Image */}
            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-8 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="w-72 h-96 md:w-80 md:h-[28rem] rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="/nalar-landing.png"
                    alt="Nalar AI"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Glow effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl opacity-30 blur-xl -z-10" />
              </motion.div>

              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                className="absolute bottom-8 left-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg"
              >
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  Powered by IndoBERT
                </span>
              </motion.div>
            </div>

            {/* Right Side - Content */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  Nalar
                </h1>
                <p className="text-lg text-blue-600 dark:text-blue-400 font-medium mb-6">
                  AI Sentiment Analyst
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-4 mb-8"
              >
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Saya <strong>Nalar</strong>, AI analisis sentimen berbasis{" "}
                  <strong>IndoBERT</strong> yang dilatih khusus untuk bahasa Indonesia.
                </p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Saya langsung menganalisis emosi dan opini dari berita media cetak
                  yang Anda upload dengan akurasi tinggi.
                </p>
              </motion.div>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="grid grid-cols-2 gap-4 mb-8"
              >
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">92%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Akurasi</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-4">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">12K+</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Artikel</p>
                </div>
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <Button
                  onClick={() => router.push("/print-media-ocr/main")}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Mulai Analisis
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
