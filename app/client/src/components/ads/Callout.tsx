import { CommonComponentProps } from "./common";

type CalloutProps = CommonComponentProps & {
  variant?: "success" | "info" | "warning" | "danger"; //default info
};

export default function Callout(props: CalloutProps) {
  return "";
}
