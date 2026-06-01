"use client";

import Header from "@/components/Header";
import ProgressDashboard from "@/components/ProgressDashboard";

export default function ProgressPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto w-full px-6 py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Your Progress
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your learning journey across all decks
            </p>
          </div>
          <ProgressDashboard />
        </div>
      </main>
    </>
  );
}
