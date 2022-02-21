import React from "react";
import Icon, { IconCollection, IconSize } from "./Icon";
import { render, screen } from "@testing-library/react";
import { Colors } from "constants/Colors";

import MagicLineIcon from "remixicon-react/MagicLineIcon";
import KeyIcon from "remixicon-react/Key2LineIcon";

describe("Enterprise icon", () => {
  [
    {
      name: "enterprise",
      input: ["enterprise", "magic-line"],
      actualIcon: <MagicLineIcon />,
    },
    {
      name: "key",
      input: ["key"],
      actualIcon: <KeyIcon />,
    },
  ].forEach(({ actualIcon, input, name }: any) => {
    input.forEach((iconString: string) => {
      it(`${name}: ${iconString}`, () => {
        // render the icons
        render(
          <div data-testid="container">
            <Icon
              data-testid={"basically-a-span"}
              fillColor={Colors.BLUE_BAYOUX}
              name={iconString as typeof IconCollection[number]}
              size={IconSize.XXL}
            />
            {actualIcon}
          </div>,
        );
        const output = screen.queryByTestId("container");
        const outputChildren = output && output.children;
        const actual = outputChildren && outputChildren[0];
        const expected = outputChildren && outputChildren[1];
        const actualSvg = actual && actual.children && actual.children[0];
        const actualPath =
          actualSvg && actualSvg.children && actualSvg.children[0];
        const expectedSvg = expected;
        const expectedPath =
          expected && expected.children && expected.children[0];
        expect(actualSvg).toEqual(expectedSvg);
        expect(actualPath).toEqual(expectedPath);
      });
    });
  });
});
