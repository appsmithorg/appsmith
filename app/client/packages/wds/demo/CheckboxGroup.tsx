import React, { useState, PropsWithChildren } from "react";

import { Checkbox } from "../components/Checkbox/Checkbox";
import Showcase, { useControls } from "./Showcase";

type Props = {
  primaryColor: string;
  loading: boolean;
};

const CheckboxGroupShowcase = (props: Props) => {
  const { primaryColor } = props;
  const { controls, state } = useControls({
    controls: [
      ["input", "label", "Label"],
      ["input", "description", ""],
      ["select", "labelPosition", "top", ["top", "left"]],
      ["select", "orientation", "horizontal", ["horizontal", "vertical"]],
      ["checkbox", "isLoading", false],
      ["checkbox", "isDisabled", false],
    ],
  });

  const commonProps = {
    accentColor: primaryColor,
  };

  const { description, label, labelPosition, orientation, ...rest } = state;

  return (
    <Showcase height="auto" settings={controls} title="Checkbox" width="auto">
      <Checkbox.Group
        description={description}
        label={label}
        labelPosition={labelPosition}
        orientation={orientation}
      >
        <Checkbox
          accentColor={primaryColor}
          label="Option 1"
          value="1"
          {...rest}
        />
        <Checkbox
          accentColor={primaryColor}
          label="Option 2"
          value="2"
          {...rest}
        />
        <Checkbox
          accentColor={primaryColor}
          label="Option 3"
          value="3"
          {...rest}
        />
      </Checkbox.Group>
    </Showcase>
  );
};

export default CheckboxGroupShowcase;
