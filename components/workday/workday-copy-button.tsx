"use client";

import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
      <span className="mr-2 inline-flex items-center">
        <FontAwesomeIcon className="h-3.5 w-3.5" icon={faCopy} />
      </span>
      {copyLabel}
    </Button>
  );
}
