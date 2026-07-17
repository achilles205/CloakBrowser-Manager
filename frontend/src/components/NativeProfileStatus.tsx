import { Check, Code2, ExternalLink, Monitor } from "lucide-react";
import { useState } from "react";

interface NativeProfileStatusProps {
  profileName: string;
  cdpUrl: string | null;
}

export function NativeProfileStatus({ profileName, cdpUrl }: NativeProfileStatusProps) {
  const [copied, setCopied] = useState(false);

  const copyCdpUrl = async () => {
    if (!cdpUrl) return;
    const absoluteUrl = `${window.location.protocol}//${window.location.host}${cdpUrl}`;
    await navigator.clipboard.writeText(absoluteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="max-w-md w-full rounded-lg border border-border bg-surface-1 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/10">
          <Monitor className="h-6 w-6 text-emerald-400" />
        </div>
        <h2 className="text-base font-semibold text-gray-100">{profileName} is running</h2>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          CloakBrowser opened in a native Windows window. Use that window to browse;
          this dashboard will continue to manage its lifecycle.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-500">
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Live viewing in the dashboard is only available in Docker/VNC mode.</span>
        </div>
        {cdpUrl && (
          <button
            type="button"
            onClick={() => void copyCdpUrl()}
            className="btn-secondary mx-auto mt-5 flex items-center gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Code2 className="h-3.5 w-3.5" />}
            <span>{copied ? "CDP URL copied" : "Copy CDP endpoint"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
