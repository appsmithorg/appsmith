import { ReactNode } from "react";
import { IconName } from "./Icon";
import { CommonComponentProps } from "./common";

type DropdownOption = {
  label: string;
  value: string;
  id?: string;
  icon: IconName; // Create an icon library
  onSelect?: (option: DropdownOption) => void;
  children?: DropdownOption[];
};

export enum DropdownDisplayType {
  TAGS = "TAGS",
  CHECKBOXES = "CHECKBOXES",
}

type DropdownProps = CommonComponentProps & {
  options: DropdownOption[];
  selectHandler: (selectedValue: string) => void;
  selected?: DropdownOption;
  multiselectDisplayType?: DropdownDisplayType;
  checked?: boolean;
  multi?: boolean;
  autocomplete?: boolean;
  addItem?: {
    displayText: string;
    addItemHandler: (name: string) => void;
  };
  toggle?: ReactNode;
};

export default function Button(props: DropdownProps) {
  return null;
}
