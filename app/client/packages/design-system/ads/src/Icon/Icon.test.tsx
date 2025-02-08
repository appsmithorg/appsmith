import React, { lazy, Suspense } from "react";
import { render } from "@testing-library/react";
import { IconCollection } from "./Icon.provider";
import { IconClassName } from "./Icon.constants";
import type { IconNames } from "./Icon.types";

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
          <Icon name={iconKey as IconNames} size="sm" />
        </Suspense>,
      );

      // eslint-disable-next-line testing-library/no-node-access
      expect(container.firstChild).toBeDefined();
    });
  });

  it("makes canvas blank when name field is undefined", () => {
    const { getByTestId } = render(
      <Icon
        data-testid={IconClassName}
        name={undefined as unknown as IconNames}
      />,
    );
    // eslint-disable-next-line testing-library/prefer-screen-queries
    const icon = getByTestId(IconClassName);

    // eslint-disable-next-line testing-library/no-node-access
    expect(icon.firstChild).toBe(null);
  });
});
