import React from "react";
import { render } from "@testing-library/react";
import "jest-styled-components";
import CheckboxComponent from ".";
import { Colors } from "constants/Colors";
import { LabelPosition } from "components/constants";
import { AlignWidgetTypes } from "WidgetProvider/constants";

describe("CheckboxComponent", () => {
  it("should render the StyledCheckbox with align-items set to center", () => {
    const { container } = render(
      <CheckboxComponent
        widgetId="1"
        isChecked={true}
        isLoading={false}
        label="Test Label"
        onCheckChange={() => {}}
        accentColor={Colors.GREEN_SOLID}
        borderRadius="0"
        labelPosition={LabelPosition.Left}
        alignWidget={AlignWidgetTypes.LEFT}
        isDynamicHeightEnabled={false}
        isLabelInline={false}
        isRequired={false}
        isValid={true}
        minHeight={50}
        isFullWidth={true}
        inputRef={() => {}}
      />,
    );
    const styledCheckbox = container.querySelector(".bp3-checkbox");
    expect(styledCheckbox).toHaveStyleRule("align-items", "center");
  });
});
