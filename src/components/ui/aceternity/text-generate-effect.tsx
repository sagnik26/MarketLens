"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  duration?: number;
  filter?: boolean;
}

export function TextGenerateEffect({
  words,
  className,
  duration = 0.5,
  filter = true,
}: TextGenerateEffectProps) {
  const [mounted, setMounted] = useState(false);
  const tokenized = words.split(" ");

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <span className={cn("inline", className)}>{words}</span>;
  }

  return (
    <span className={cn("inline", className)}>
      {tokenized.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 10, filter: filter ? "blur(8px)" : "none" }}
          animate={{ opacity: 1, y: 0, filter: "none" }}
          transition={{
            duration,
            delay: i * 0.05,
          }}
          className="inline-block"
          style={{ marginRight: "0.25em" }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
