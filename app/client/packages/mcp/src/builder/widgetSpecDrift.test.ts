import type { z } from "zod";
import type { widgetSpecVariants } from "./schema.js";
import { widgetSpecSchema, type WidgetSpec } from "./schema.js";

// WidgetSpec is written by hand next to widgetSpecSchema. These checks run in the type checker (`tsc --noEmit` and
// ts-jest): a field added to one side and not the other, or a widget type on only one side, fails the build.
type Inferred = z.infer<ReturnType<typeof widgetSpecVariants>>;

type Same<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

type FieldsOf<U, T> = keyof Extract<U, { type: T }>;

// The widget types whose fields differ between the two sides. `never` when they match.
type FieldDrift = {
  [T in WidgetSpec["type"]]: Same<
    FieldsOf<WidgetSpec, T>,
    FieldsOf<Inferred, T>
  > extends true
    ? never
    : T;
}[WidgetSpec["type"]];

const sameWidgetTypes: Same<WidgetSpec["type"], Inferred["type"]> = true;
const noFieldDrift: [FieldDrift] extends [never] ? true : FieldDrift = true;

describe("WidgetSpec and widgetSpecSchema stay in sync", () => {
  it("has the same widget types and the same fields on each", () => {
    expect(sameWidgetTypes).toBe(true);
    expect(noFieldDrift).toBe(true);
  });

  it("parses with the exported schema", () => {
    expect(
      widgetSpecSchema.safeParse({ type: "text", text: "Hi" }).success,
    ).toBe(true);
  });
});
