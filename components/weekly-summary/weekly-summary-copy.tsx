"use client";

import { faCopy, faFileArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
        <span className="mr-2 inline-flex items-center">
          <FontAwesomeIcon className="h-3.5 w-3.5" icon={faCopy} />
        </span>
        {copyLabel}
      </Button>
      <Button
        disabled={!summaryText}
        onClick={exportSummaryText}
        type="button"
        variant="secondary"
      >
        <span className="mr-2 inline-flex items-center">
          <FontAwesomeIcon className="h-3.5 w-3.5" icon={faFileArrowDown} />
        </span>
        Export .txt
      </Button>
    </div>
  );
}
