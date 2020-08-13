import { CommonComponentProps } from "./common";

type TagProps = CommonComponentProps & {
  onClick: (text: string) => void;
  text: boolean;
  variant?: "success" | "info" | "warning" | "danger"; //default info
};

export default function Tag(props: TagProps) {
  return null;
}
