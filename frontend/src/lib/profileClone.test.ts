import { describe, expect, it } from "vitest";
import type { Profile } from "./api";
import { profileToCloneData } from "./profileClone";

const source: Profile = {
  id: "source-id",
  name: "Seller Profile",
  fingerprint_seed: 43210,
  proxy: "socks5://user:pass@proxy.example:1080",
  timezone: "Asia/Bangkok",
  locale: "en-US",
  platform: "windows",
  user_agent: "Custom UA",
  screen_width: 1920,
  screen_height: 1080,
  gpu_vendor: "Vendor",
  gpu_renderer: "Renderer",
  hardware_concurrency: 8,
  humanize: true,
  human_preset: "careful",
  headless: false,
  geoip: true,
  clipboard_sync: true,
  auto_launch: false,
  color_scheme: "light",
  launch_args: ["--load-extension=C:\\Extensions\\Cookies"],
  notes: "Source notes",
  user_data_dir: "C:\\Profiles\\source-id",
  created_at: "2026-07-18T00:00:00Z",
  updated_at: "2026-07-18T00:00:00Z",
  tags: [{ tag: "Shop", color: "#6366f1" }],
  status: "running",
  vnc_ws_port: null,
  cdp_url: "http://127.0.0.1:9222",
  view_mode: "native",
};

describe("profileToCloneData", () => {
  it("copies configuration but excludes identity, runtime state, and browser storage", () => {
    const clone = profileToCloneData(source, [source.name]);

    expect(clone).toMatchObject({
      name: "Seller Profile (Clone)",
      fingerprint_seed: 43210,
      proxy: "socks5://user:pass@proxy.example:1080",
      timezone: "Asia/Bangkok",
      locale: "en-US",
      launch_args: ["--load-extension=C:\\Extensions\\Cookies"],
      tags: [{ tag: "Shop", color: "#6366f1" }],
    });
    expect(clone).not.toHaveProperty("id");
    expect(clone).not.toHaveProperty("user_data_dir");
    expect(clone).not.toHaveProperty("status");
    expect(clone).not.toHaveProperty("cdp_url");
    expect(clone.launch_args).not.toBe(source.launch_args);
    expect(clone.tags).not.toBe(source.tags);
  });

  it("generates a unique clone name", () => {
    const clone = profileToCloneData(source, [
      source.name,
      "Seller Profile (Clone)",
      "Seller Profile (Clone 2)",
    ]);

    expect(clone.name).toBe("Seller Profile (Clone 3)");
  });
});
