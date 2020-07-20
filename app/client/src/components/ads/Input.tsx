import { CommonComponentProps } from "./common";
import { IconName } from "./Icons";

type TextProps = CommonComponentProps & {
  placeholder?: string;
  value: string;
  hasError: boolean;
  disabled: boolean;
  password?: boolean;
  leftIcon?: IconName;
  onChange: Function;
};

export default function Text(props: TextProps) {
  return "";
}
