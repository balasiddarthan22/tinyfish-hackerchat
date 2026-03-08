"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Trophy,
  Wrench,
  X,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { BenchmarkResult, LeaderboardEntry } from "@/lib/benchmark";

function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
}

function ScoreRing({
  score,
  maxScore,
}: {
  score: number;
  maxScore: number;
}) {
  const pct = maxScore > 0 ? score / maxScore : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  const color =
    pct >= 0.8 ? "#22c55e" : pct >= 0.5 ? "#eab308" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          fill="none"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        <motion.circle
          cx="60"
          cy="60"
          fill="none"
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeLinecap="round"
          strokeWidth="8"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="text-3xl font-bold"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground">/ {maxScore}</span>
      </div>
    </div>
  );
}

function RoundCard({
  round,
  title,
  score,
  maxScore,
  matched,
  index,
}: {
  round: number;
  title: string;
  score: number;
  maxScore: number;
  matched: string[];
  index: number;
}) {
  const passed = score === maxScore;
  const partial = score > 0 && score < maxScore;

  return (
    <motion.div
      className={`flex items-center gap-3 rounded-lg border p-3 ${
        passed
          ? "border-green-500/30 bg-green-500/5"
          : partial
            ? "border-yellow-500/30 bg-yellow-500/5"
            : "border-red-500/30 bg-red-500/5"
      }`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 + index * 0.1 }}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
        {round}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate">{title}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm tabular-nums font-medium">
              {score}/{maxScore}
            </span>
            {passed ? (
              <CheckCircle2 className="size-4 text-green-500" />
            ) : partial ? (
              <CheckCircle2 className="size-4 text-yellow-500" />
            ) : (
              <XCircle className="size-4 text-red-500" />
            )}
          </div>
        </div>
        {matched.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {matched.map((m) => (
              <span
                className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                key={m}
              >
                {m}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function BenchmarkResults({
  result,
  username,
  onDismiss,
}: {
  result: BenchmarkResult;
  username: string;
  onDismiss?: () => void;
}) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [submitting, setSubmitting] = useState(true);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    async function submitAndFetch() {
      const [, leaderboardRes] = await Promise.allSettled([
        fetch("/api/benchmark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ result }),
        }),
        fetch("/api/benchmark"),
      ]);

      if (leaderboardRes.status === "fulfilled" && leaderboardRes.value.ok) {
        try {
          setLeaderboard(await leaderboardRes.value.json());
        } catch {
          // ignore parse errors
        }
      }

      setSubmitting(false);
    }

    submitAndFetch();
  }, [result]);

  const efficiency = result.totalScore > 0
    ? Math.round((result.totalScore / Math.max(result.toolCalls, 1)) * 10)
    : 0;

  return (
    <motion.div
      className="relative mx-auto mt-4 w-full max-w-lg rounded-xl border bg-background p-5 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Close button */}
      {onDismiss && (
        <button
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={onDismiss}
          type="button"
        >
          <X className="size-5" />
        </button>
      )}

      {/* Header */}
      <div className="mb-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <Trophy className="mx-auto mb-2 size-8 text-yellow-500" />
        </motion.div>
        <h3 className="text-lg font-semibold">Benchmark Complete</h3>
      </div>

      {/* Score Ring */}
      <div className="mb-5 flex justify-center">
        <ScoreRing maxScore={result.maxScore} score={result.totalScore} />
      </div>

      {/* Stats Row */}
      <div className="mb-5 grid grid-cols-3 gap-3 text-center">
        <motion.div
          className="rounded-lg bg-muted/50 p-2.5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Wrench className="mx-auto mb-1 size-4 text-muted-foreground" />
          <div className="text-lg font-semibold tabular-nums">{result.toolCalls}</div>
          <div className="text-[10px] text-muted-foreground">Tool Calls</div>
        </motion.div>
        <motion.div
          className="rounded-lg bg-muted/50 p-2.5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Clock className="mx-auto mb-1 size-4 text-muted-foreground" />
          <div className="text-lg font-semibold tabular-nums">
            {formatDuration(result.durationMs)}
          </div>
          <div className="text-[10px] text-muted-foreground">Duration</div>
        </motion.div>
        <motion.div
          className="rounded-lg bg-muted/50 p-2.5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Trophy className="mx-auto mb-1 size-4 text-muted-foreground" />
          <div className="text-lg font-semibold tabular-nums">{efficiency}</div>
          <div className="text-[10px] text-muted-foreground">Efficiency</div>
        </motion.div>
      </div>

      {/* Round-by-round */}
      <div className="mb-4 space-y-2">
        {result.rounds.map((r, i) => (
          <RoundCard
            index={i}
            key={r.round}
            matched={r.matched}
            maxScore={r.maxScore}
            round={r.round}
            score={r.score}
            title={r.title}
          />
        ))}
      </div>

      {/* Leaderboard Toggle */}
      <button
        className="flex w-full items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
        onClick={() => setShowLeaderboard(!showLeaderboard)}
        type="button"
      >
        <Trophy className="size-4" />
        Leaderboard
        {showLeaderboard ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
      </button>

      {showLeaderboard && (
        <motion.div
          className="mt-3 space-y-1.5"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          {submitting ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Submitting...
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              No submissions yet
            </p>
          ) : (
            leaderboard.slice(0, 20).map((entry, i) => {
              const isYou = entry.username === username;
              return (
                <motion.div
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                    isYou ? "bg-primary/10 font-medium" : "bg-muted/30"
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={entry.userId}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 text-center text-xs text-muted-foreground tabular-nums">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                    </span>
                    <span className="truncate">{entry.username}</span>
                    {isYou && (
                      <span className="rounded bg-primary/20 px-1 py-0.5 text-[10px]">
                        you
                      </span>
                    )}
                  </div>
                  <span className="tabular-nums font-medium">
                    {entry.totalScore} pts
                  </span>
                </motion.div>
              );
            })
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
