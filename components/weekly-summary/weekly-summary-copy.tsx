"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type WeeklySummaryCopyProps = {
  summaryText: string;
  weekNumber: number;
};

export function WeeklySummaryCopy({ summaryText, weekNumber }: WeeklySummaryCopyProps) {
  const [copyLabel, setCopyLabel] = useState("Copy summary");

  async function copySummaryText() {
    await navigator.clipboard.writeText(summaryText);
    setCopyLabel("Copied");
    window.setTimeout(() => setCopyLabel("Copy summary"), 1500);
  }

  function exportSummaryText() {
    const summaryBlob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
    const summaryUrl = URL.createObjectURL(summaryBlob);
    const downloadLink = document.createElement("a");

    downloadLink.href = summaryUrl;
    downloadLink.download = `deepstation-week-${weekNumber}-billing-summary.txt`;
    downloadLink.click();
    URL.revokeObjectURL(summaryUrl);
  }

  return (
    <div className="flex gap-2">
      <Button disabled={!summaryText} onClick={copySummaryText} type="button">
        {copyLabel}
      </Button>
      <Button
        disabled={!summaryText}
        onClick={exportSummaryText}
        type="button"
        variant="secondary"
      >
        Export .txt
      </Button>
    </div>
  );
}
