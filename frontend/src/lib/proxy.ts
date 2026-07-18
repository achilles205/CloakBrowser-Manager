export const PROXY_SCHEMES = ["http", "https", "socks5"] as const;

export type ProxyScheme = (typeof PROXY_SCHEMES)[number];

export interface ProxyFormValue {
  scheme: ProxyScheme;
  address: string;
}

function isProxyScheme(value: string): value is ProxyScheme {
  return PROXY_SCHEMES.includes(value as ProxyScheme);
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function stripSupportedScheme(value: string): { scheme: ProxyScheme | null; authority: string } {
  const match = value.match(/^([a-z0-9]+):\/\/(.*)$/i);
  if (!match) return { scheme: null, authority: value };

  const scheme = match[1]?.toLowerCase() ?? "";
  if (!isProxyScheme(scheme)) {
    throw new Error("Proxy type must be HTTP, HTTPS, or SOCKS5.");
  }
  return { scheme, authority: match[2] ?? "" };
}

/** Convert a stored proxy URL back to the compact value shown in the form. */
export function proxyToFormValue(value: string | null | undefined): ProxyFormValue {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return { scheme: "http", address: "" };

  let parsed: ReturnType<typeof stripSupportedScheme>;
  try {
    parsed = stripSupportedScheme(trimmed);
  } catch {
    return { scheme: "http", address: trimmed };
  }

  const scheme = parsed.scheme ?? "http";
  const atIndex = parsed.authority.lastIndexOf("@");
  if (atIndex < 0) return { scheme, address: parsed.authority };

  const credentials = parsed.authority.slice(0, atIndex);
  const hostPort = parsed.authority.slice(atIndex + 1);
  const colonIndex = credentials.indexOf(":");
  if (colonIndex < 0) return { scheme, address: parsed.authority };

  const username = safeDecode(credentials.slice(0, colonIndex));
  const password = safeDecode(credentials.slice(colonIndex + 1));
  return { scheme, address: `${hostPort}:${username}:${password}` };
}

function validateHostAndPort(host: string, port: string) {
  if (!host || /[\s/@]/.test(host)) {
    throw new Error("Proxy host is required and cannot contain spaces.");
  }
  if (!/^\d+$/.test(port)) {
    throw new Error("Proxy port must be a number.");
  }
  const portNumber = Number(port);
  if (portNumber < 1 || portNumber > 65535) {
    throw new Error("Proxy port must be between 1 and 65535.");
  }
}

/** Build the canonical URL consumed by CloakBrowser from a compact proxy value. */
export function buildProxyUrl(scheme: ProxyScheme, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const { authority } = stripSupportedScheme(trimmed);
  const parts = authority.split(":");
  const atIndex = authority.lastIndexOf("@");

  // Prefer the advertised compact format when the first two fields are host/port.
  // This keeps @ and additional colons valid inside the password field.
  if (parts.length >= 4 && (atIndex < 0 || /^\d+$/.test(parts[1] ?? ""))) {
    const [host = "", port = "", username = "", ...passwordParts] = parts;
    const password = passwordParts.join(":");
    validateHostAndPort(host, port);
    if (!username || !password) throw new Error("Proxy username and password are required.");
    return `${scheme}://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}`;
  }

  if (atIndex >= 0) {
    const credentials = authority.slice(0, atIndex);
    const hostPort = authority.slice(atIndex + 1);
    const credentialSeparator = credentials.indexOf(":");
    const hostPortSeparator = hostPort.lastIndexOf(":");
    if (credentialSeparator < 1 || hostPortSeparator < 1) {
      throw new Error("Use host:port or host:port:user:pass.");
    }

    const username = safeDecode(credentials.slice(0, credentialSeparator));
    const password = safeDecode(credentials.slice(credentialSeparator + 1));
    const host = hostPort.slice(0, hostPortSeparator);
    const port = hostPort.slice(hostPortSeparator + 1);
    validateHostAndPort(host, port);
    if (!username || !password) throw new Error("Proxy username and password are required.");

    return `${scheme}://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}`;
  }

  if (parts.length === 2) {
    const [host = "", port = ""] = parts;
    validateHostAndPort(host, port);
    return `${scheme}://${host}:${port}`;
  }

  throw new Error("Use host:port or host:port:user:pass.");
}
