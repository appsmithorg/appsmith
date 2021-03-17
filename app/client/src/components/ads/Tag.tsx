import { CommonComponentProps } from "./common";

export type TagProps = CommonComponentProps & {
  onClick: (text: string) => void;
  text: boolean;
  variant?: "success" | "info" | "warning" | "danger"; //default info
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Tag(props: TagProps) {
  return null;
}
