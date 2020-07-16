import { CommonComponentProps } from "./common";
import { IconName } from "./Icons";

type IconSelectorProps = CommonComponentProps & {
  onSelect: (icon: IconName) => void;
};

export default function IconSelector(props: IconSelectorProps) {
  return "";
}
