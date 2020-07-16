import { CommonComponentProps } from "./common";

type TextProps = CommonComponentProps & {
  placeholder?: string;
  value: string;
  hasError: boolean;
  disabled: boolean;
  cypressSelector?: string;
};

export default function Text(props: TextProps) {
  return "";
}
