import { Alignment, Label } from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import {
  FontStyleTypes,
  TextSize,
  TEXT_SIZES,
} from "constants/WidgetConstants";
import { LabelPosition } from "components/constants";
import { TooltipComponent as Tooltip } from "design-system";
import { LABEL_MAX_WIDTH_RATE } from "components/ads/LabelWithTooltip";

export const TextLabelWrapper = styled.div<{
  compactMode: boolean;
  alignment?: Alignment;
  position?: LabelPosition;
  width?: number;
}>`
  display: flex;

  ${({ alignment, compactMode, position, width }) => `
    ${
      position !== LabelPosition.Top &&
      (position === LabelPosition.Left || compactMode)
        ? `&&& {margin-right: 5px; flex-shrink: 0;} max-width: ${LABEL_MAX_WIDTH_RATE}%;`
        : `width: 100%;`
    }
    ${position === LabelPosition.Left &&
      `
      ${!width && `width: 33%`};
      ${alignment === Alignment.RIGHT && `justify-content: flex-end`};
      label {
        ${width && `width: ${width}px`};
        ${
          alignment === Alignment.RIGHT
            ? `text-align: right`
            : `text-align: left`
        };
      }
    `}
  `}
`;

export const StyledLabel = styled(Label)<{
  $compactMode: boolean;
  $disabled: boolean;
  $labelText?: string;
  $labelTextColor?: string;
  $labelTextSize?: TextSize;
  $labelStyle?: string;
}>`
  overflow-y: hidden;
  text-overflow: ellipsis;
  width: ${(props) => (props.$compactMode ? "auto" : "100%")};
  text-align: left;
  color: ${(props) =>
    props.$labelTextColor
      ? props.$labelTextColor
      : props.$disabled
      ? Colors.GREY_8
      : "inherit"};
  font-size: ${(props) =>
    props.$labelTextSize ? TEXT_SIZES[props.$labelTextSize] : "14px"};
  font-weight: ${(props) =>
    props?.$labelStyle?.includes(FontStyleTypes.BOLD) ? "bold" : "normal"};
  font-style: ${(props) =>
    props?.$labelStyle?.includes(FontStyleTypes.ITALIC) ? "italic" : ""};
`;

export const StyledTooltip = styled(Tooltip)`
  overflow: hidden;
`;
