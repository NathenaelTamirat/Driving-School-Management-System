import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class strings", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves Tailwind conflicts (later wins)", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });

  it("handles undefined and null values", () => {
    expect(cn("a", undefined, null, "b")).toBe("a b");
  });

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("");
  });
});
