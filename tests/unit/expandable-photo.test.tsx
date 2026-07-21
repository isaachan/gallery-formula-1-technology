import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ExpandablePhoto } from "../../src/components/expandable-photo";

describe("ExpandablePhoto", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the photo inside a trigger button that announces the lightbox affordance", () => {
    render(
      <ExpandablePhoto
        src="/img.jpg"
        alt="Alfa Romeo 158 at Silverstone"
        imgClassName="car-hero-photo"
      />,
    );

    const trigger = screen.getByRole("button");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute(
      "aria-label",
      "查看大图：Alfa Romeo 158 at Silverstone",
    );
    const img = trigger.querySelector("img");
    expect(img).toHaveAttribute("src", "/img.jpg");
    expect(img).toHaveAttribute("alt", "Alfa Romeo 158 at Silverstone");
    expect(img).toHaveClass("car-hero-photo");
  });

  it("opens a modal dialog showing the photo and credit on activation, and locks body scroll", () => {
    render(
      <ExpandablePhoto src="/img.jpg" alt="a car" credit="© Wikimedia" />,
    );

    fireEvent.click(screen.getByRole("button"));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", "查看大图");
    const largeImg = dialog.querySelector("img");
    expect(largeImg).toHaveAttribute("src", "/img.jpg");
    expect(dialog).toHaveTextContent("© Wikimedia");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores focus to the trigger and unlocks scroll on close", () => {
    render(<ExpandablePhoto src="/img.jpg" alt="a car" />);
    const trigger = screen.getByRole("button");

    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "关闭大图" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on Escape and on a backdrop click (but not when clicking the image itself)", () => {
    const { container } = render(
      <ExpandablePhoto src="/img.jpg" alt="a car" />,
    );
    const trigger = screen.getByRole("button");

    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog");

    // Clicking the inner image must not close.
    fireEvent.click(dialog.querySelector("img") as Element);
    expect(dialog).toBeInTheDocument();

    // Clicking the backdrop (dialog root itself) closes.
    fireEvent.click(dialog);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Reopen and verify Escape closes too.
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the trigger button in sync with open state and moves focus into the dialog on open", () => {
    render(<ExpandablePhoto src="/img.jpg" alt="a car" />);
    const trigger = screen.getByRole("button");

    act(() => {
      fireEvent.click(trigger);
    });

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "关闭大图" })).toHaveFocus();
  });

  it("omits the credit figcaption when no credit is provided", () => {
    render(<ExpandablePhoto src="/img.jpg" alt="a car" />);
    fireEvent.click(screen.getByRole("button"));

    const dialog = screen.getByRole("dialog");
    expect(dialog.querySelector("figcaption")).toBeNull();
  });
});
