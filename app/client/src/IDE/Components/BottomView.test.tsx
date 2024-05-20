import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import BottomView from "./BottomView";
import { ViewHideBehaviour } from "../Interfaces/View";
import { noop } from "lodash";

describe("BottomView", () => {
  it("it can be collapsed that is still visible", () => {
    const { getByText } = render(
      <BottomView
        behaviour={ViewHideBehaviour.COLLAPSE}
        height={300}
        hidden={false}
        onHideClick={noop}
        setHeight={noop}
      >
        <div id="bottomview">Hey test</div>
      </BottomView>,
    );

    expect(getByText("Hey test")).toBe("");
  });
});
