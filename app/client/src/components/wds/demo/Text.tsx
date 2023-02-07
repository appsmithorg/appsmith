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
      ["input", "capHeight", "14"],
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

  const { content, ...rest } = state;

  return (
    <Showcase settings={controls} title="Text">
      <Text {...rest} fontFamily="notoSans">
        {content}
      </Text>
    </Showcase>
  );
};

export default TextShowcase;
