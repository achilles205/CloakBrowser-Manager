import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider, ThemeToggle } from "./Theme";

beforeEach(() => {
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "";
  localStorage.clear();
});

describe("ThemeProvider", () => {
  it("uses light mode by default and persists a dark selection", async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    expect(screen.getByRole("button", { name: "Switch to dark theme" })).toBeTruthy();
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(localStorage.getItem("cloakbrowser-manager-theme")).toBe("dark");
    });
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeTruthy();
  });

  it("honors the theme class applied before React starts", () => {
    document.documentElement.classList.add("dark");

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeTruthy();
  });

  it("restores a saved theme without relying on the pre-render script", () => {
    localStorage.setItem("cloakbrowser-manager-theme", "dark");

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeTruthy();
  });
});
