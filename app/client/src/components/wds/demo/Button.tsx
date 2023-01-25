import React, { useState, PropsWithChildren } from "react";

import { Button } from "components/wds";
import Icon from "components/wds/components/Icon";
import Showcase, { useControls } from "./Showcase";

type Props = {
  loading: boolean;
};

const ButtonShowcase = (props: Props) => {
  const { controls, state } = useControls({
    controls: [
      [
        "select",
        "variant",
        "filled",
        ["filled", "light", "outline", "link", "subtle"],
      ],
      ["input", "accentColor", ""],
      ["input", "label", "Label"],
      ["checkbox", "isLoading", false],
      ["checkbox", "isDisabled", false],
    ],
  });

  const { label, leadingIcon, ...rest } = state;

  return (
    <Showcase settings={controls} title="Button">
      <Button {...rest}>{label}</Button>
    </Showcase>
  );
};

export default ButtonShowcase;
