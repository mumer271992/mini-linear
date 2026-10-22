"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  initialAppliedValues?: string[];
  onApply?: (values: string[]) => void;
}

// Tracks two separate states on purpose: draftValues (checkboxes toggled
// while open) and appliedValues (what's actually committed and shown in the
// trigger label). Only clicking Apply moves draft -> applied; dismissing via
// outside click or Escape discards the draft instead.
//
// initialAppliedValues only seeds state on mount (a plain useState
// initializer, not synced on every prop change) -- when the applied filters
// are driven externally (e.g. by the URL), the parent is expected to force
// a remount via `key` when that external value changes, rather than this
// component silently re-syncing out from under an in-progress edit.
export function FilterDropdown({
  label,
  options,
  initialAppliedValues = [],
  onApply,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [appliedValues, setAppliedValues] = useState<string[]>(initialAppliedValues);
  const [draftValues, setDraftValues] = useState<string[]>(initialAppliedValues);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function toggleOpen() {
    if (!isOpen) {
      // Every open starts from the last applied state, so an abandoned
      // draft from a prior dismissed-without-Apply open never lingers.
      setDraftValues(appliedValues);
    }
    setIsOpen((open) => !open);
  }

  function toggleOption(value: string) {
    setDraftValues((current) =>
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    );
  }

  function handleApply() {
    setAppliedValues(draftValues);
    setIsOpen(false);
    onApply?.(draftValues);
  }

  function handleClear() {
    setAppliedValues([]);
    setDraftValues([]);
    setIsOpen(false);
    onApply?.([]);
  }

  const triggerLabel =
    appliedValues.length > 0
      ? `${label}: ${appliedValues
          .map((value) => options.find((option) => option.value === value)?.label ?? value)
          .join(", ")}`
      : label;

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-black/[.08] py-1.5 pl-3 pr-1.5 text-sm text-zinc-700 hover:border-zinc-950 dark:border-white/[.145] dark:text-zinc-300 dark:hover:border-zinc-50",
          appliedValues.length > 0 && "border-zinc-950 dark:border-zinc-50",
        )}
      >
        <button
          type="button"
          onClick={toggleOpen}
          aria-haspopup="true"
          aria-expanded={isOpen}
          className="cursor-pointer"
        >
          {triggerLabel}
        </button>

        {appliedValues.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            aria-label={`Clear ${label} filter`}
            className="cursor-pointer rounded p-0.5 text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-56 rounded-md border border-black/[.08] bg-white p-2 shadow-lg dark:border-white/[.145] dark:bg-zinc-900">
          <ul className="flex max-h-60 flex-col gap-1 overflow-y-auto">
            {options.map((option) => {
              const id = `${label}-${option.value}`;

              return (
                <li key={option.value}>
                  <label
                    htmlFor={id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-black/[.03] dark:hover:bg-white/[.05]"
                  >
                    <input
                      id={id}
                      type="checkbox"
                      checked={draftValues.includes(option.value)}
                      onChange={() => toggleOption(option.value)}
                      className="cursor-pointer"
                    />
                    {option.label}
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="mt-2 border-t border-black/[.08] pt-2 dark:border-white/[.145]">
            <Button type="button" onClick={handleApply} className="w-full px-3 py-1.5">
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
