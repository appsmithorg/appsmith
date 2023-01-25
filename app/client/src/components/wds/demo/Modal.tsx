import React, { useState, PropsWithChildren } from "react";

import { Button } from "components/wds";
import Showcase, { useControls } from "./Showcase";
import { Modal } from "../components/Modal/Modal";

type Props = {
  primaryColor: string;
  loading: boolean;
};

const ModalShowcase = (props: Props) => {
  const { primaryColor } = props;
  const [opened, setOpened] = useState(false);
  const { controls, state } = useControls({
    controls: [
      [
        "select",
        "variant",
        "filled",
        ["filled", "outline", "light", "white", "link", "subtle"],
      ],
      ["input", "label", "Label"],
      [
        "select",
        "icon",
        "none",
        ["none", "plus", "pencil", "close", "spinner"],
      ],
      ["checkbox", "isLoading", false],
      ["checkbox", "isDisabled", false],
    ],
  });

  const commonProps = {
    accentColor: primaryColor,
  };

  const { icon, label, ...rest } = state;

  return (
    <Showcase settings={controls} title="Button">
      <div
        style={{
          height: 32,
          width: 180,
        }}
      >
        <Modal onClose={() => setOpened(false)} opened={opened}>
          Hello world
        </Modal>
        <Button {...commonProps} {...rest} onClick={() => setOpened(true)}>
          {label}
        </Button>
      </div>
    </Showcase>
  );
};

export default ModalShowcase;
