import React from "react";

import Showcase, { useControls } from "./Showcase";
import { Text } from "../components/Text";

type Props = {
  loading: boolean;
};

const TextShowcase = (props: Props) => {
  const { controls, state } = useControls({
    controls: [
      ["input", "content", "This is a text"],
      ["input", "color", ""],
      ["select", "textAlign", "left", ["left", "center", "right"]],
      ["select", "fontStyle", "normal", ["normal", "italic"]],
      [
        "select",
        "fontWeight",
        "normal",
        ["normal", "bold", "bolder", "lighter"],
      ],
      ["checkbox", "isLoading", false],
      ["checkbox", "isDisabled", false],
    ],
  });

  const { capHeight, content, ...rest } = state;

  return (
    <Showcase settings={controls} title="Text">
      <Text {...rest}>{content}</Text>
    </Showcase>
  );
};

export default TextShowcase;
