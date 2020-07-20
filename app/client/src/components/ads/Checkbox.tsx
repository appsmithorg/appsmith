import { CommonComponentProps } from "./common";

type CheckboxProps = CommonComponentProps & {
  label: string;
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
  align: "left" | "right";
};

export default function Checkbox(props: CheckboxProps) {
  return "";
}
