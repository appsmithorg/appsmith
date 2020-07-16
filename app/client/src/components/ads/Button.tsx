import { IconName } from "./Icons";
import { CommonComponentProps } from "./common";

type ButtonProps = CommonComponentProps & {
  onClick: Function;
  category?: "primary" | "secondary" | "tertiary"; //default primary
  variant?: "success" | "info" | "warning" | "danger" | "link"; //default info
  icon?: IconName; //default undefined.
  size?: "small" | "medium" | "large"; // default medium
};
// https://design.gitlab.com/components/button

export default function Button(props: ButtonProps) {
  return "";
}
