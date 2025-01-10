import type {
  BaseCellComponentProps,
  GroupButtonConfig,
  CompactMode,
} from "../Constants";
import type { ButtonVariant } from "components/constants";

export interface ButtonGroupCellProps extends BaseCellComponentProps {
  groupButtons?: Record<string, GroupButtonConfig>;
  orientation?: "horizontal" | "vertical";
  buttonVariant?: ButtonVariant;
  isDisabled?: boolean;
  compactMode: CompactMode;
  allowCellWrapping?: boolean;
  fontStyle?: string;
  textColor?: string;
  textSize?: string;
}
