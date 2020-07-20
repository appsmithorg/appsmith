import { CommonComponentProps } from "./common";

type ToastProps = CommonComponentProps & {
  text: string;
  duration: number;
  variant?: "success" | "info" | "warning" | "danger"; //default info
  keepOnHover?: boolean;
  onComplete?: Function;
};

export default function Toast(props: ToastProps) {
  return "";
}
