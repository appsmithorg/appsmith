import React from "react";
import Text, {
  TextType,
  Case,
  FontWeight,
  TextProps,
} from "components/ads/Text";
import { withDesign } from "storybook-addon-designs";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";

export default {
  title: storyName.platform.text.PATH,
  component: Text,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

export function TextStory(args: TextProps) {
  return <Text {...args}>Hi there, I am {args.type} element.</Text>;
}

TextStory.args = {
  type: TextType.H1,
  underline: false,
  italic: false,
  case: Case.CAPITALIZE,
  className: "",
  weight: FontWeight.NORMAL,
  highlight: false,
  textAlign: "left",
};

TextStory.argTypes = {
  type: {
    control: controlType.SELECT,
    options: Object.values(TextType),
  },
  underline: { control: controlType.BOOLEAN },
  italic: { control: controlType.BOOLEAN },
  case: {
    control: controlType.SELECT,
    options: Object.values(Case),
  },
  className: { control: controlType.TEXT },
  weight: {
    control: controlType.SELECT,
    options: Object.values(FontWeight),
  },
  highlight: { control: controlType.BOOLEAN },
  textAlign: { control: controlType.TEXT },
};

TextStory.storyName = storyName.platform.text.NAME;
