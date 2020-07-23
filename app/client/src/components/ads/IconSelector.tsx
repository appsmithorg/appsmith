import { CommonComponentProps } from "./common";
import { IconName } from "./Icon";

type IconSelectorProps = CommonComponentProps & {
  onSelect: (icon: IconName) => void;
};

export default function IconSelector(props: IconSelectorProps) {
  return "";
}
