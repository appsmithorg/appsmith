import React, { useState, PropsWithChildren } from "react";
import Icon from "../components/Icon";

import { TextInput } from "../components/TextInput/TextInput";
import Showcase, { useControls } from "./Showcase";

type Props = {
  primaryColor: string;
  loading: boolean;
};

const TextInputShowcase = (props: Props) => {
  const { primaryColor } = props;
  const { controls, state } = useControls({
    controls: [
      ["select", "variant", "default", ["default", "filled", "unstyled"]],
      ["input", "label", "Label"],
      ["input", "description", ""],
      ["select", "labelPosition", "top", ["top", "left"]],
      ["select", "visualPosition", "leading", ["leading", "trailing"]],
      ["checkbox", "isLoading", false],
      ["checkbox", "isDisabled", false],
    ],
  });

  const commonProps = {
    accentColor: primaryColor,
  };

  const { visualPosition, ...rest } = state;

  return (
    <Showcase settings={controls} title="TextInput">
      <TextInput
        leadingVisual={visualPosition === "leading" && <Icon name="plus" />}
        loaderPosition="trailing"
        trailingVisual={visualPosition === "trailing" && <Icon name="plus" />}
        {...rest}
      />
    </Showcase>
  );
};

export default TextInputShowcase;
