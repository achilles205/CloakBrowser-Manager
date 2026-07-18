import { describe, expect, it } from "vitest";
import { buildProxyUrl, proxyToFormValue } from "./proxy";

describe("buildProxyUrl", () => {
  it.each(["http", "https", "socks5"] as const)(
    "builds an authenticated %s proxy from host:port:user:pass",
    (scheme) => {
      expect(buildProxyUrl(scheme, "192.0.2.10:6238:proxy-user:proxy-pass")).toBe(
        `${scheme}://proxy-user:proxy-pass@192.0.2.10:6238`,
      );
    },
  );

  it("supports host:port without authentication", () => {
    expect(buildProxyUrl("http", "proxy.example:8080")).toBe("http://proxy.example:8080");
  });

  it("encodes special characters in credentials", () => {
    expect(buildProxyUrl("socks5", "host:1080:user@example:p@ss:word")).toBe(
      "socks5://user%40example:p%40ss%3Aword@host:1080",
    );
  });

  it("rejects invalid ports", () => {
    expect(() => buildProxyUrl("http", "host:70000:user:pass")).toThrow(
      "between 1 and 65535",
    );
  });
});

describe("proxyToFormValue", () => {
  it("converts a stored authenticated URL back to compact form", () => {
    expect(proxyToFormValue("socks5://user%40example:p%40ss@host:1080")).toEqual({
      scheme: "socks5",
      address: "host:1080:user@example:p@ss",
    });
  });

  it("defaults legacy compact proxies to HTTP", () => {
    expect(proxyToFormValue("host:8080:user:pass")).toEqual({
      scheme: "http",
      address: "host:8080:user:pass",
    });
  });
});
