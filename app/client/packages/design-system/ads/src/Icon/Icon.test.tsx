import React, { lazy, Suspense } from "react";
import { render } from "@testing-library/react";
import { IconCollection } from "./Icon.provider";
import { IconClassName } from "./Icon.constants";

describe("Icon Component", () => {
  // this workaround to retroactively make Icon a default export is required because
  // React/lazy doesn't yet support named exports
  // https://github.com/facebook/react/issues/14603
  const Icon = lazy(async () =>
    import("./Icon").then((module) => ({ default: module.Icon })),
  );

  it("renders Icon for all available Icon Names", () => {
    IconCollection.forEach((iconKey) => {
      const { container } = render(
        <Suspense fallback={<svg height={12} width={12} />}>
          <Icon name={iconKey} size="sm" />
        </Suspense>,
      );

      expect(container.firstChild).toBeDefined();
    });
  });

  it("makes canvas blank when name field is blank", () => {
    const { getByTestId } = render(
      <Icon data-testid={IconClassName} name="" />,
    );
    const icon = getByTestId(IconClassName);
    expect(icon.firstChild).toBe(null);
  });
});
