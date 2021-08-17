import React from "react";
import Dropdown, {
  DropdownProps,
  DropdownOption,
} from "components/ads/Dropdown";
import { withKnobs, select, boolean, text } from "@storybook/addon-knobs";
import { withDesign } from "storybook-addon-designs";
import { Variant } from "components/ads/common";
import { IconCollection, IconName } from "components/ads/Icon";
import { action } from "@storybook/addon-actions";
import { storyName } from "./config/constants";
import { controlType, statusType } from "./config/types";

export default {
  title: storyName.platform.form.dropdown.PATH,
  component: Dropdown,
  decorators: [withDesign],
  parameters: {
    status: {
      type: statusType.STABLE,
    },
  },
};

const TextOptions = [
  {
    id: "111abc",
    value: text("1st Option", "First option"),
  },
  {
    id: "222abc",
    value: text("2nd Option", "Second option"),
  },
  {
    id: "322abc",
    value: text("3rd Option", "Third option"),
  },
];

const IconAndTextOptions = [
  {
    id: "111abc",
    value: text("1st Option", "Delete"),
    icon: select("1st Icon", IconCollection, "delete"),
    subText: "subtext1",
  },
  {
    id: "222abc",
    value: text("2nd Option", "User"),
    icon: select("2nd Icon", IconCollection, "user"),
    subText: "subtext2",
  },
  {
    id: "322abc",
    value: text("3rd Option", "General"),
    icon: select("3rd Icon", IconCollection, "general"),
    subText: "subtext3",
  },
];

const LabelAndTextOptions = [
  {
    id: "111abc",
    value: text("1st Option", "Admin"),
    label: text("1st label", "Can edit, view and invite other user to an app"),
    onSelect: action("selected-option"),
  },
  {
    id: "222abc",
    value: text("2nd Option", "Developer"),
    label: text("2nd label", "Can edit, view and invite other user to an app"),
    onSelect: action("selected-option"),
  },
  {
    id: "322abc",
    value: text("3rd Option", "User"),
    label: text("3rd label", "Can edit, view and invite other user to an app"),
    onSelect: action("selected-option"),
  },
];

export function Primary(args: any) {
  if (args.type === "Text") {
    args.options = TextOptions;
    args.selected = undefined;
  } else if (args.type === "Icon and text") {
    args.options = IconAndTextOptions;
    args.selected = undefined;
  } else {
    args.options = LabelAndTextOptions;
    args.selected = LabelAndTextOptions[0];
  }
  delete args.type;
  return <Dropdown {...args} />;
}

Primary.args = {
  disabled: false,
  onSelect: () => {
    action("selected-option");
  },
};

Primary.argTypes = {
  type: {
    control: controlType.RADIO,
    options: ["Text", "Icon and text", "Label and text"],
    defaultValue: "Text",
  },
  selected: {
    control: controlType.OBJECT,
  },
  width: { control: controlType.NUMBER },
  height: { control: controlType.NUMBER },
  showLabelOnly: { control: controlType.BOOLEAN },
  optionWidth: { control: controlType.NUMBER },
  dropdownHeight: { control: controlType.NUMBER },
  dropdownMaxHeight: { control: controlType.NUMBER },
  showDropIcon: { control: controlType.BOOLEAN },
  dropdownTriggerIcon: { control: controlType.OBJECT },
  containerClassName: { control: controlType.TEXT },
  headerLabel: { control: controlType.NUMBER },
  bgColor: { control: controlType.COLOR },
  isLoading: { control: controlType.BOOLEAN },
  errorMsg: { control: controlType.TEXT },
};

Primary.storyName = storyName.platform.form.dropdown.NAME;
