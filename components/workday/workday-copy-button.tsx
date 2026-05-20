"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type WorkdayCopyButtonProps = {
  commentText: string;
};

export function WorkdayCopyButton({ commentText }: WorkdayCopyButtonProps) {
  const [copyLabel, setCopyLabel] = useState("Copy comment");

  async function copyComment() {
    await navigator.clipboard.writeText(commentText);
    setCopyLabel("Copied");
    window.setTimeout(() => setCopyLabel("Copy comment"), 1500);
  }

  return (
    <Button
      className="h-9 px-3"
      disabled={!commentText}
      onClick={copyComment}
      type="button"
      variant="secondary"
    >
      {copyLabel}
    </Button>
  );
}
