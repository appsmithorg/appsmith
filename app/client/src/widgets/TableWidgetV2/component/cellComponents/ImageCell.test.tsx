import { ImageCell } from "./ImageCell";
import { render, fireEvent } from "@testing-library/react";
import React from "react";
import {
  CompactModeTypes,
  CellAlignmentTypes,
  VerticalAlignmentTypes,
} from "../Constants";

describe("Test on ImageCell component", () => {
  it("test to check if the click even is getting propogated for image cell", () => {
    const props = {
      allowCellWrapping: true,
      cellBackground: "red",
      compactMode: CompactModeTypes.DEFAULT,
      fontStyle: "bold",
      horizontalAlignment: CellAlignmentTypes.LEFT,
      isCellDisabled: false,
      isCellVisible: true,
      isHidden: false,
      onClick: jest.fn(),
      textColor: "black",
      textSize: "large",
      value: "https://randomuser.me/api/portraits/men/2.jpg",
      verticalAlignment: VerticalAlignmentTypes.CENTER,
    };
    const outerFunction = jest.fn();
    const { container } = render(
      <div onClick={outerFunction}>
        <ImageCell {...props} />
      </div>,
    );
    const imageCell = container.getElementsByClassName("image-cell")[0];
    expect(imageCell).toBeInTheDocument;
    fireEvent.click(imageCell);
    expect(props.onClick).toHaveBeenCalled();
    expect(outerFunction).toHaveBeenCalled();
  });
});
