import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Profile } from "../lib/api";
import { ProfileList } from "./ProfileList";

const profile: Profile = {
  id: "profile-abc-123",
  name: "Windows Profile",
  fingerprint_seed: 12345,
  proxy: null,
  timezone: null,
  locale: null,
  platform: "windows",
  user_agent: null,
  screen_width: 1920,
  screen_height: 1080,
  gpu_vendor: null,
  gpu_renderer: null,
  hardware_concurrency: null,
  humanize: false,
  human_preset: "default",
  headless: false,
  geoip: false,
  clipboard_sync: true,
  auto_launch: false,
  color_scheme: "light",
  launch_args: [],
  notes: null,
  user_data_dir: "C:\\Profiles\\profile-abc-123",
  created_at: "2026-07-17T00:00:00Z",
  updated_at: "2026-07-17T00:00:00Z",
  tags: [],
  status: "stopped",
  vnc_ws_port: null,
  cdp_url: null,
  view_mode: "native",
};

const writeText = vi.fn();

beforeEach(() => {
  writeText.mockReset();
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
});

describe("ProfileList", () => {
  it("copies a profile ID from its three-dot menu without selecting the profile", async () => {
    const onSelect = vi.fn();
    render(
      <ProfileList
        profiles={[profile]}
        selectedId={null}
        onSelect={onSelect}
        onNew={vi.fn()}
        onClone={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open menu for Windows Profile" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Copy Profile ID" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("profile-abc-123"));
    expect(screen.getByRole("menuitem", { name: "Copied!" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Profile ID copied to clipboard");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("closes the menu when Escape is pressed", () => {
    render(
      <ProfileList
        profiles={[profile]}
        selectedId={null}
        onSelect={vi.fn()}
        onNew={vi.fn()}
        onClone={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Open menu for Windows Profile" });
    fireEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("clones a profile from the menu without selecting the source row", async () => {
    const onClone = vi.fn().mockResolvedValue(undefined);
    const onSelect = vi.fn();
    render(
      <ProfileList
        profiles={[profile]}
        selectedId={null}
        onSelect={onSelect}
        onNew={vi.fn()}
        onClone={onClone}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open menu for Windows Profile" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Clone Profile" }));

    await waitFor(() => expect(onClone).toHaveBeenCalledWith(profile));
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(onSelect).not.toHaveBeenCalled();
  });
});
