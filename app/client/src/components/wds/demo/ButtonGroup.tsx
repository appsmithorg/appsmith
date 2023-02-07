import React from "react";

import { Button } from "components/wds";
import { ButtonGroup } from "components/wds/components/Button/ButtonGroup";
import Showcase, { useControls } from "./Showcase";

type Props = {
  loading: boolean;
};

const ButtonGroupShowcase = (props: Props) => {
  const { controls, state } = useControls({
    controls: [
      ["select", "orientation", "horizontal", ["horizontal", "vertical"]],
      ["checkbox", "isLoading", false],
      ["checkbox", "isDisabled", false],
    ],
  });

  const { label, orientation, ...rest } = state;

  return (
    <Showcase settings={controls} title="ButtonGroup">
      <ButtonGroup orientation={orientation}>
        <Button {...rest}>Edit</Button>
        <Button {...rest}>Share</Button>
        <Button {...rest}>Delete</Button>
      </ButtonGroup>
    </Showcase>
  );
};

export default ButtonGroupShowcase;
