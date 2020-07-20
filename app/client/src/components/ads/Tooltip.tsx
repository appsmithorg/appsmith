import { CommonComponentProps } from "./common";

type TooltipProps = CommonComponentProps & {
  content: string | JSX.Element;
  position: "TOP" | "BOTTOM" | "LEFT" | "RIGHT";
  hoverOnDelay: number;
};

export default function Tooltip(props: TooltipProps) {
  return "";
}
