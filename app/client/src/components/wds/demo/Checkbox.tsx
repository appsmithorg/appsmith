import React, { useState, PropsWithChildren } from "react";

import { Checkbox } from "../components/Checkbox/Checkbox";
import Showcase, { useControls } from "./Showcase";

type Props = {
  primaryColor: string;
  loading: boolean;
};

const CheckboxShowcase = (props: Props) => {
  const { primaryColor } = props;
  const { controls, state } = useControls({
    controls: [
      ["input", "label", "Label"],
      ["input", "description", "Description"],
      ["select", "labelPosition", "right", ["left", "right"]],
      ["checkbox", "isLoading", false],
      ["checkbox", "isDisabled", false],
    ],
  });

  const commonProps = {
    accentColor: primaryColor,
  };

  const { ...rest } = state;

  return (
    <Showcase settings={controls} title="Checkbox">
      <Checkbox {...commonProps} {...rest} />
    </Showcase>
  );
};

export default CheckboxShowcase;
