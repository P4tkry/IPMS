"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NextStepButtonProps = {
  label: string;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
};

export default function NextStepButton({
  label,
  isLoading,
  onClick,
  className,
  disabled,
}: NextStepButtonProps) {
  return (
    <Button
      type="button"
      className={cn(
        "h-12 rounded-2xl bg-[#2a241f] px-6 text-sm text-[#f6efe8] shadow-[0_18px_30px_-18px_rgba(42,36,31,0.6)] transition hover:bg-[#3a332c]",
        className,
      )}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#f6efe8]/70 border-t-[#f6efe8]" />
          {label}
        </span>
      ) : (
        label
      )}
    </Button>
  );
}
