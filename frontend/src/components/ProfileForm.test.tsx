import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProfileForm } from "./ProfileForm";

describe("ProfileForm proxy configuration", () => {
  it.each(["http", "https", "socks5"] as const)(
    "saves compact credentials as an authenticated %s proxy",
    async (scheme) => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<ProfileForm profile={null} onSave={onSave} onCancel={vi.fn()} />);

      fireEvent.change(screen.getByPlaceholderText("e.g. Amazon Seller #1"), {
        target: { value: "Proxy profile" },
      });
      fireEvent.change(screen.getByRole("combobox", { name: "Proxy Type" }), {
        target: { value: scheme },
      });
      fireEvent.change(screen.getByRole("textbox", { name: "Proxy Address" }), {
        target: { value: "192.0.2.10:6238:proxy-user:proxy-pass" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Create" }));

      await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
      expect(onSave.mock.calls[0]?.[0].proxy).toBe(
        `${scheme}://proxy-user:proxy-pass@192.0.2.10:6238`,
      );
    },
  );

  it("shows an inline error and does not save an invalid port", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<ProfileForm profile={null} onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. Amazon Seller #1"), {
      target: { value: "Invalid proxy" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Proxy Address" }), {
      target: { value: "host:not-a-port:user:pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Proxy port must be a number.")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });
});
