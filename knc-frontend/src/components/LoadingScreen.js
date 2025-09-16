"use client";

import { motion } from "framer-motion";

export default function LoadingScreen({ isVisible }) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="fixed inset-0 flex items-center justify-center bg-white z-50"
    >
      {/* Circle ripple loader like Apple */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0.6 }}
        animate={{
          scale: [0.8, 1.2, 0.8],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-20 h-20 rounded-full bg-primary"
      />
    </motion.div>
  );
}
