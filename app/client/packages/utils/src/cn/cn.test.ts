import { cn } from "./cn";

describe("cn function", () => {
  it("should merge class names correctly", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("should handle conditional class names", () => {
    expect(cn("class1", false && "class2", "class3")).toBe("class1 class3");
  });

  it("should deduplicate class names", () => {
    expect(cn("w-full", "w-full", "class2")).toBe("w-full class2");
  });

  it("should merge Tailwind classes correctly", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("should handle empty inputs", () => {
    expect(cn()).toBe("");
  });

  it("should handle null and undefined inputs", () => {
    expect(cn("class1", null, undefined, "class2")).toBe("class1 class2");
  });

  it("should handle array inputs", () => {
    expect(cn(["class1", "class2"], "class3")).toBe("class1 class2 class3");
  });

  it("should handle objects with truthy values", () => {
    expect(cn({ class1: true, class2: false }, "class3")).toBe("class1 class3");
  });

  it("should handle mixed inputs", () => {
    expect(
      cn("class1", ["class2", { class3: true, class4: false }], "class5"),
    ).toBe("class1 class2 class3 class5");
  });
});
