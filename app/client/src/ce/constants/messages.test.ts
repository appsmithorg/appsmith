import { ERROR_WIDGET_COPY_NOT_ALLOWED } from "./messages";

describe("messages", () => {
  it("checks for ERROR_WIDGET_COPY_NOT_ALLOWED string", () => {
    expect(ERROR_WIDGET_COPY_NOT_ALLOWED()).toBe(
      "This selected widget cannot be copied.",
    );
  });
});
