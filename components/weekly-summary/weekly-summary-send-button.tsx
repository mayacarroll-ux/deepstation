"use client";

import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type WeeklySummarySendButtonProps = {
  idleLabel: string;
  disabled?: boolean;
};

export function WeeklySummarySendButton({ disabled = false, idleLabel }: WeeklySummarySendButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full whitespace-nowrap sm:w-auto" disabled={pending || disabled} type="submit">
      <span className="mr-2 inline-flex items-center">
        <FontAwesomeIcon className="h-3.5 w-3.5" icon={faPaperPlane} />
      </span>
      {pending ? "Sending..." : idleLabel}
    </Button>
  );
}
