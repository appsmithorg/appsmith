import { CommonComponentProps } from "./common";

type ToastProps = CommonComponentProps & {
  text: string;
  duration: number;
  variant?: "success" | "info" | "warning" | "danger"; //default info
  keepOnHover?: boolean;
  onComplete?: Function;
  position:
    | "top-right"
    | "top-center"
    | "top-left"
    | "bottom-right"
    | "bottom-center"
    | "bottom-left";
};

export default function Toast(props: ToastProps) {
  return null;
}
