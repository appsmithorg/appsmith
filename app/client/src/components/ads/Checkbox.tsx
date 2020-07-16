import { CommonComponentProps } from "./common";

type CheckboxProps = CommonComponentProps & {
  label: string;
  isChecked: boolean;
  onCheckChange: (isChecked: boolean) => void;
  isLoading: boolean;
  align: "left" | "right";
  cypressSelector?: string;
};

export default function Checkbox(props: CheckboxProps) {
  return "";
}
