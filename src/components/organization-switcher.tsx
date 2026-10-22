"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { logout } from "@/server/actions/auth";

interface OrganizationOption {
  id: string;
  name: string;
  slug: string;
}

interface OrganizationSwitcherProps {
  organizations: OrganizationOption[];
  currentOrganizationId: string;
  userEmail: string;
}

export function OrganizationSwitcher({
  organizations,
  currentOrganizationId,
  userEmail,
}: OrganizationSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOrganization = organizations.find(
    (organization) => organization.id === currentOrganizationId,
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative mt-auto border-t border-white/10 p-2">
      {isOpen && (
        <div className="absolute bottom-full left-2 right-2 mb-1 rounded-md border border-white/10 bg-zinc-900 p-1 shadow-lg">
          <ul className="flex flex-col">
            {organizations.map((organization) => (
              <li key={organization.id}>
                <Link
                  href={`/dashboard/${organization.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  <span className="truncate">{organization.name}</span>
                  {organization.id === currentOrganizationId && (
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4 shrink-0"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <div className="my-1 border-t border-white/10" />

          <Link
            href="/onboarding"
            onClick={() => setIsOpen(false)}
            className="block rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Create new organization
          </Link>

          <div className="my-1 border-t border-white/10" />

          <Link
            href={`/dashboard/${currentOrganization?.slug}/settings/account`}
            onClick={() => setIsOpen(false)}
            className="block truncate rounded-md px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800"
          >
            {userEmail}
          </Link>
          {/* Wrapped rather than passed directly: a form action receives
              FormData as its first argument, which logout would take as its
              fallbackPath. */}
          <form action={async () => logout()}>
            <button
              type="submit"
              className="block w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Log out
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
      >
        <span className="truncate">{currentOrganization?.name}</span>
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
