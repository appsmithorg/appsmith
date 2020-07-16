import { CommonComponentProps } from "./common";

type RadioProps = CommonComponentProps & {
  align?: "horizontal" | "vertical" | "column" | "row";
  columns?: number;
  rows?: number;
  value?: string;
};

export default function Radio(props: RadioProps) {
  return "";
}
