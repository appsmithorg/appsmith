import React, { useCallback, useRef, useState } from "react";
import styled from "styled-components";
import { Alignment, Classes, Label, Position } from "@blueprintjs/core";

import { LabelPosition, LABEL_MAX_WIDTH_RATE } from "components/constants";
import {
  FontStyleTypes,
  TextSize,
  TEXT_SIZES,
} from "constants/WidgetConstants";
import Tooltip from "./Tooltip";
import { isEllipsisActive } from "utils/helpers";
import { Colors } from "constants/Colors";
import { IconWrapper } from "constants/IconConstants";
import { ReactComponent as HelpIcon } from "assets/icons/control/help.svg";

export interface LabelContainerProps {
  alignment?: Alignment;
  compact: boolean;
  inline?: boolean;
  optionCount?: number;
  position?: LabelPosition;
  width?: number;
}

export const LabelContainer = styled.div<LabelContainerProps>`
  display: flex;
  align-items: center;
  min-height: 30px;

  ${({ alignment, compact, inline, optionCount, position, width }) => `
    ${
      position !== LabelPosition.Top &&
      (position === LabelPosition.Left || compact)
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

    ${!inline && optionCount && optionCount > 1 && `align-self: flex-start;`}
  `}
`;

export const StyledTooltip = styled(Tooltip)`
  overflow: hidden;
`;

export interface StyledLabelProps {
  color?: string;
  compact: boolean;
  disabled?: boolean;
  fontSize?: TextSize;
  fontStyle?: string;
  hasHelpText: boolean;
  position?: LabelPosition;
}

export const StyledLabel = styled(Label)<StyledLabelProps>`
  &&& {
    ${({ compact, hasHelpText, position }) => {
      if (position === LabelPosition.Top) {
        return `margin-bottom: 5px; ${
          hasHelpText ? "margin-right: 5px" : "margin-right: 0px"
        }`;
      }
      if (compact || position === LabelPosition.Left)
        return "margin-bottom: 0px; margin-right: 5px";
      return `margin-bottom: 5px; ${
        hasHelpText ? "margin-right: 5px" : "margin-right: 0px"
      }`;
    }};

    ${({ color, disabled, fontSize, fontStyle }) => `
      color: ${disabled ? Colors.GREY_8 : color || "inherit"};
      font-size: ${fontSize ? TEXT_SIZES[fontSize] : "14px"};
      font-weight: ${
        fontStyle?.includes(FontStyleTypes.BOLD) ? "bold" : "normal"
      };
      font-style: ${
        fontStyle?.includes(FontStyleTypes.ITALIC) ? "italic" : "normal"
      };
    `}
  }
`;

interface TooltipIconProps {
  compact: boolean;
  position?: LabelPosition;
}

const ToolTipIcon = styled(IconWrapper)<TooltipIconProps>`
  cursor: help;
  margin-top: 1.5px;
  &&&:hover {
    svg {
      path {
        fill: #716e6e;
      }
    }
  }

  ${({ compact, position }) => {
    if (position === LabelPosition.Top) {
      return "margin-bottom: 5px";
    }
    if (compact || position === LabelPosition.Left) return "margin-bottom: 0px";
    return "margin-bottom: 5px";
  }};
`;

export interface LabelWithTooltipProps {
  alignment?: Alignment;
  className?: string;
  color?: string;
  compact: boolean;
  disabled?: boolean;
  fontSize?: TextSize;
  fontStyle?: string;
  helpText?: string;
  inline?: boolean;
  loading?: boolean;
  optionCount?: number;
  position?: LabelPosition;
  text: string;
  width?: number;
}

const LabelWithTooltip = React.forwardRef<
  HTMLDivElement,
  LabelWithTooltipProps
>((props, ref) => {
  const {
    alignment,
    className,
    color,
    compact,
    disabled,
    fontSize,
    fontStyle,
    helpText,
    inline,
    loading,
    optionCount,
    position,
    text,
    width,
  } = props;

  const [tooltipOpen, setTooltipOpen] = useState(false);

  const labelRef = useRef<HTMLLabelElement | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (isEllipsisActive(labelRef.current)) {
      setTooltipOpen(true);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltipOpen(false);
  }, []);

  return (
    <LabelContainer
      alignment={alignment}
      className="label-container"
      compact={compact}
      data-cy="label-container"
      inline={inline}
      optionCount={optionCount}
      position={position}
      ref={ref}
      width={width}
    >
      <StyledTooltip
        content={text}
        hoverOpenDelay={200}
        isOpen={tooltipOpen}
        position={Position.TOP}
      >
        <StyledLabel
          className={`${
            loading ? Classes.SKELETON : Classes.TEXT_OVERFLOW_ELLIPSIS
          } ${className}`}
          color={color}
          compact={compact}
          disabled={disabled}
          elementRef={labelRef}
          fontSize={fontSize}
          fontStyle={fontStyle}
          hasHelpText={!!helpText}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          position={position}
        >
          {text}
        </StyledLabel>
      </StyledTooltip>
      {helpText && (
        <Tooltip
          content={helpText}
          hoverOpenDelay={200}
          position={Position.TOP}
        >
          <ToolTipIcon
            color={Colors.SILVER_CHALICE}
            compact={compact}
            height={14}
            position={position}
            width={14}
          >
            <HelpIcon className="t--input-widget-tooltip" />
          </ToolTipIcon>
        </Tooltip>
      )}
    </LabelContainer>
  );
});
LabelWithTooltip.displayName = "LabelWithTooltip";

export default LabelWithTooltip;
