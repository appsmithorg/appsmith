import { CommonComponentProps } from "./common";

export enum EditInteractionKind {
  SINGLE,
  DOUBLE,
}

type EditableTextProps = CommonComponentProps & {
  type: "text" | "password" | "email" | "phone" | "date";
  defaultValue: string;
  onTextChanged: (value: string) => void;
  placeholder: string;
  cypressSelector?: string;
  valueTransform?: (value: string) => string;
  isEditingDefault?: boolean;
  forceDefault?: boolean;
  updating?: boolean;
  isInvalid?: (value: string) => string | boolean;
  editInteractionKind: EditInteractionKind;
  hideEditIcon?: boolean;
};

// Check EditableText Component
export default function(props: EditableTextProps) {
  return null;
}
