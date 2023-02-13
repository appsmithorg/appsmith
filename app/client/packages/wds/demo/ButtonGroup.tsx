import React from "react";

import { Button } from "..";
import { ButtonGroup } from "../components/ButtonGroup";
import Showcase, { useControls } from "./Showcase";

type Props = {
  loading: boolean;
};

const ButtonGroupShowcase = (props: Props) => {
  const { controls, state } = useControls({
    controls: [
      ["select", "orientation", "horizontal", ["horizontal", "vertical"]],
      ["checkbox", "isDisabled", false],
      ["select", "variant", "filled", ["filled", "light", "outline", "subtle"]],
    ],
  });

  const { label, orientation, ...rest } = state;

  return (
    <Showcase settings={controls} title="ButtonGroup" width={250}>
      <ButtonGroup orientation={orientation}>
        <Button {...rest}>Edit</Button>
        <Button {...rest}>Share</Button>
        <Button {...rest}>Delete</Button>
      </ButtonGroup>
    </Showcase>
  );
};

export default ButtonGroupShowcase;
