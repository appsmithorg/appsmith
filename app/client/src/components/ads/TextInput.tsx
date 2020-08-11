import { CommonComponentProps } from "./common";

type TextProps = CommonComponentProps & {
  placeholder?: string;
  value: string;
  hasError: boolean;
  disabled: boolean;
  validator: (value: string) => { isValid: boolean; message: string };
  onChange: (value: string) => void;
  cypressSelector?: string;
};

export default function Text(props: TextProps) {
  return null;
}
