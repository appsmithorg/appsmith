import { CommonComponentProps } from "./common";

type ColorSelectorProps = CommonComponentProps & {
  onSelect: (hex: string) => void;
};

export default function ColorSelector(props: ColorSelectorProps) {
  return null;
}
