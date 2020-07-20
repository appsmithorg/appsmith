import { CommonComponentProps } from "./common";

type ToggleProps = CommonComponentProps & {
  onToggle: (value: boolean) => void;
  value: boolean;
};

export default function Switch(props: ToggleProps) {
  return "";
}
