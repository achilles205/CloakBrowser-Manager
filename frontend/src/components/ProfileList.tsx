import {
  Check,
  Copy,
  CopyPlus,
  EllipsisVertical,
  LoaderCircle,
  Monitor,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Profile } from "../lib/api";
import { StatusIndicator } from "./StatusIndicator";

interface ProfileListProps {
  profiles: Profile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onClone: (profile: Profile) => Promise<void>;
}

interface MenuPosition {
  left: number;
  top: number;
}

type CopyStatus = "copied" | "error" | null;

interface ProxySummary {
  endpoint: string;
  scheme: string | null;
}

function getProxySummary(proxy: string | null): ProxySummary {
  const trimmed = proxy?.trim();
  if (!trimmed) return { endpoint: "Direct", scheme: null };

  const schemeMatch = trimmed.match(/^([a-z0-9]+):\/\/(.*)$/i);
  const scheme = schemeMatch?.[1]?.toUpperCase() ?? "HTTP";
  const authority = schemeMatch?.[2] ?? trimmed;
  const atIndex = authority.lastIndexOf("@");

  if (atIndex >= 0) {
    return {
      endpoint: authority.slice(atIndex + 1),
      scheme,
    };
  }

  // Keep credentials out of the table if a legacy compact
  // host:port:user:pass value is returned by an older backend.
  const parts = authority.split(":");
  if (parts.length >= 4 && /^\d+$/.test(parts[1] ?? "")) {
    return {
      endpoint: `${parts[0]}:${parts[1]}`,
      scheme,
    };
  }

  return { endpoint: authority, scheme };
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Fall back for non-secure HTTP origins and restricted browser contexts.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) throw new Error("Clipboard copy failed");
}

interface ProfileMenuProps {
  profile: Profile;
  open: boolean;
  copyStatus: CopyStatus;
  cloning: boolean;
  cloneFailed: boolean;
  onToggle: () => void;
  onClose: () => void;
  onCopy: () => void;
  onClone: () => void;
}

function ProfileMenu({
  profile,
  open,
  copyStatus,
  cloning,
  cloneFailed,
  onToggle,
  onClose,
  onCopy,
  onClone,
}: ProfileMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<MenuPosition>({ left: 0, top: 0 });

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        triggerRef.current?.focus();
      }
    };
    const handleScroll = () => onClose();

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, onClose]);

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 176;
      const menuHeight = 78;
      const gap = 6;
      const top = rect.bottom + gap + menuHeight <= window.innerHeight
        ? rect.bottom + gap
        : rect.top - gap - menuHeight;
      setPosition({
        left: Math.max(8, rect.right - menuWidth),
        top: Math.max(8, top),
      });
    }
    onToggle();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-surface-4 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/50"
        aria-label={`Open menu for ${profile.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Profile menu"
      >
        <EllipsisVertical className="h-4 w-4" />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Actions for ${profile.name}`}
          className="fixed z-50 w-44 rounded-md border border-border bg-surface-1 p-1 shadow-lg"
          style={position}
        >
          <button
            type="button"
            role="menuitem"
            onClick={onClone}
            disabled={cloning}
            className={`flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:cursor-wait ${
              cloneFailed
                ? "text-red-400 hover:bg-red-600/10"
                : "text-gray-300 hover:bg-surface-3"
            }`}
          >
            {cloning ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : cloneFailed ? (
              <X className="h-3.5 w-3.5" />
            ) : (
              <CopyPlus className="h-3.5 w-3.5" />
            )}
            <span>{cloning ? "Cloning..." : cloneFailed ? "Clone failed" : "Clone Profile"}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onCopy}
            className={`flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 ${
              copyStatus === "error"
                ? "text-red-400 hover:bg-red-600/10"
                : "text-gray-300 hover:bg-surface-3"
            }`}
          >
            {copyStatus === "copied" ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : copyStatus === "error" ? (
              <X className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>
              {copyStatus === "copied"
                ? "Copied!"
                : copyStatus === "error"
                  ? "Copy failed"
                  : "Copy Profile ID"}
            </span>
          </button>
        </div>,
        document.body,
      )}
    </>
  );
}

export function ProfileList({ profiles, selectedId, onSelect, onNew, onClone }: ProfileListProps) {
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [copyResult, setCopyResult] = useState<{ id: string; status: Exclude<CopyStatus, null> } | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [cloneFailedId, setCloneFailedId] = useState<string | null>(null);
  const feedbackTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current);
  }, []);

  const closeMenu = () => setOpenMenuId(null);

  const handleCopy = async (profile: Profile) => {
    if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current);
    try {
      await copyToClipboard(profile.id);
      setCopyResult({ id: profile.id, status: "copied" });
      feedbackTimer.current = window.setTimeout(() => {
        setOpenMenuId(null);
        setCopyResult(null);
      }, 1000);
    } catch {
      setCopyResult({ id: profile.id, status: "error" });
    }
  };

  const handleClone = async (profile: Profile) => {
    setCloningId(profile.id);
    setCloneFailedId(null);
    try {
      await onClone(profile);
      setOpenMenuId(null);
    } catch {
      setCloneFailedId(profile.id);
    } finally {
      setCloningId(null);
    }
  };

  const filtered = profiles
    .map((profile, index) => ({
      profile,
      number: profiles.length - index,
    }))
    .filter(({ profile }) =>
      profile.name.toLowerCase().includes(search.toLowerCase()),
    );

  const runningCount = profiles.filter((p) => p.status === "running").length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Monitor className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-semibold tracking-tight">CloakBrowser Manager</h1>
        </div>
        {runningCount > 0 && (
          <div className="text-xs text-gray-500 mb-3">
            {runningCount} running
          </div>
        )}
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search profiles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-8 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Profile list */}
      <div className="flex-1 overflow-y-auto" role="table" aria-label="Browser profiles">
        <div
          role="row"
          className="sticky top-0 z-10 grid grid-cols-[2.75rem_minmax(0,1fr)_minmax(8.75rem,0.9fr)_2.25rem] items-center border-b border-border bg-surface-1 px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500"
        >
          <span role="columnheader" className="text-center">
            No.
          </span>
          <span role="columnheader" className="px-2">
            Title
          </span>
          <span role="columnheader" className="px-2">
            Proxy
          </span>
          <span role="columnheader" className="sr-only">
            Actions
          </span>
        </div>

        {filtered.length === 0 && (
          <div className="text-center text-gray-500 text-xs py-8">
            {profiles.length === 0 ? "No profiles yet" : "No matches"}
          </div>
        )}
        <div role="rowgroup" className="p-2">
          {filtered.map(({ profile, number }) => {
            const proxy = getProxySummary(profile.proxy);

            return (
              <div
                key={profile.id}
                role="row"
                className={`relative mb-1 grid grid-cols-[2.75rem_minmax(0,1fr)_minmax(8.75rem,0.9fr)_2.25rem] items-stretch rounded-md border transition-colors ${
                  selectedId === profile.id
                    ? "border-border-hover bg-surface-3"
                    : "border-transparent hover:bg-surface-2"
                }`}
              >
                <div
                  role="cell"
                  className="flex items-center justify-center border-r border-border/70 px-1 text-xs font-medium tabular-nums text-gray-500"
                >
                  {number}
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(profile.id)}
                  className="col-span-2 grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(8.75rem,0.9fr)] text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent/50"
                  aria-label={`Select profile ${profile.name}`}
                >
                  <div role="cell" className="min-w-0 px-2 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <StatusIndicator status={profile.status} />
                      <span className="truncate text-sm font-medium">{profile.name}</span>
                    </div>
                    <div className="ml-4 mt-1 flex items-center gap-2">
                      <span className="text-xs capitalize text-gray-500">{profile.platform}</span>
                    </div>
                    {profile.tags.length > 0 && (
                      <div className="ml-4 mt-1.5 flex flex-wrap gap-1">
                        {profile.tags.map((t) => (
                          <span
                            key={t.tag}
                            className="rounded-full border border-border bg-surface-4 px-1.5 py-0.5 text-[10px] text-gray-400"
                            style={t.color ? { backgroundColor: `${t.color}18`, borderColor: `${t.color}55` } : undefined}
                          >
                            {t.tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div role="cell" className="min-w-0 border-l border-border/70 px-2 py-2.5">
                    <div
                      className={`truncate text-xs font-medium ${profile.proxy ? "text-gray-300" : "text-gray-500"}`}
                      title={profile.proxy ? `${proxy.scheme?.toLowerCase()}://${proxy.endpoint}` : "Direct connection"}
                    >
                      {proxy.endpoint}
                    </div>
                    {proxy.scheme && (
                      <div className="mt-1.5 flex items-center">
                        <span
                          className="rounded border border-accent/20 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-accent"
                        >
                          {proxy.scheme}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
                <div role="cell" className="flex items-start justify-center pt-1.5">
                  <ProfileMenu
                    profile={profile}
                    open={openMenuId === profile.id}
                    copyStatus={copyResult?.id === profile.id ? copyResult.status : null}
                    cloning={cloningId === profile.id}
                    cloneFailed={cloneFailedId === profile.id}
                    onToggle={() => {
                      setCopyResult(null);
                      setCloneFailedId(null);
                      setOpenMenuId((current) => current === profile.id ? null : profile.id);
                    }}
                    onClose={closeMenu}
                    onCopy={() => void handleCopy(profile)}
                    onClone={() => void handleClone(profile)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {copyResult?.status === "copied" ? "Profile ID copied to clipboard" : ""}
      </div>

      {/* New profile button */}
      <div className="p-3 border-t border-border">
        <button onClick={onNew} className="btn-secondary w-full flex items-center justify-center gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          <span>New Profile</span>
        </button>
      </div>
    </div>
  );
}
