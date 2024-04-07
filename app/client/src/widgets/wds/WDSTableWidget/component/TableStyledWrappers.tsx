import styled, { css } from "styled-components";
import type {
  TableSizes,
  CellLayoutProperties,
  CellAlignment,
  VerticalAlignment,
  ImageSize,
} from "./Constants";
import {
  JUSTIFY_CONTENT,
  ALIGN_ITEMS,
  IMAGE_HORIZONTAL_ALIGN,
  IMAGE_VERTICAL_ALIGN,
  TEXT_ALIGN,
  TABLE_SIZES,
  ImageSizes,
  MULTISELECT_CHECKBOX_WIDTH,
} from "./Constants";
import type { Color } from "constants/Colors";
import { Colors } from "constants/Colors";
import { invisible } from "constants/DefaultTheme";
import { lightenColor, darkenColor } from "widgets/WidgetUtils";
import { FontStyleTypes } from "constants/WidgetConstants";
import { Classes } from "@blueprintjs/core";
import type { TableVariant } from "../constants";
import { Layers } from "constants/Layers";

const BORDER_RADIUS = "border-radius: 4px;";
const HEADER_CONTROL_FONT_SIZE = "12px";

export const TableWrapper = styled.div<{
  width: number;
  height: number;
  tableSizes: TableSizes;
  accentColor: string;
  backgroundColor?: Color;
  triggerRowSelection: boolean;
  isHeaderVisible?: boolean;
  borderRadius: string;
  boxShadow?: string;
  borderColor?: string;
  borderWidth?: number;
  isResizingColumn?: boolean;
  variant?: TableVariant;
  isAddRowInProgress: boolean;
}>`
  .column-freeze {
  }
`;

export const DropDownWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  z-index: 1;
  padding: 10px;
  ${BORDER_RADIUS}
  border: 1px solid ${Colors.ATHENS_GRAY};
  box-shadow: 0px 2px 4px rgba(67, 70, 74, 0.14);
`;

export const OptionWrapper = styled.div<{
  selected: boolean;
  isHeader?: boolean;
}>`
  display: flex;
  width: 100%;
  justify-content: space-between;
  height: 32px;
  box-sizing: border-box;
  padding: 8px;
  color: ${(props) => (props.selected ? Colors.WHITE : Colors.OXFORD_BLUE)};
  font-size: 14px;
  min-width: 200px;
  cursor: ${(props) => (!props.isHeader ? "pointer" : "default")};
  ${BORDER_RADIUS}
  margin: 3px 0;
  background: ${(props) => (props.selected ? Colors.GREEN : Colors.WHITE)};
  &:hover {
    background: ${(props) => (props.selected ? Colors.GREEN : Colors.POLAR)};
  }
  .column-type {
    width: 100%;
  }
  &.non-selectable {
    background: ${(props) =>
      !props.isHeader ? Colors.WHITE_SMOKE : Colors.WHITE_CLOUD};
  }
`;

export const MenuColumnWrapper = styled.div<{ selected: boolean }>`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  background: ${(props) => props.selected && Colors.GREEN};
  position: relative;
  .title {
    color: ${(props) => (props.selected ? Colors.WHITE : Colors.OXFORD_BLUE)};
    margin-left: 10px;
  }
  .sub-menu {
    position: absolute;
    right: 0;
  }
`;

export const ActionWrapper = styled.div<{ disabled: boolean }>`
  margin: 0 5px 0 0;
  ${(props) => (props.disabled ? "cursor: not-allowed;" : null)}
  &&&&&& {
    .bp3-button {
      border: none;
    }
    .bp3-button span {
      font-weight: 400;
      text-decoration: none;
    }
    &&& .bp3-disabled {
      background: ${Colors.GREY_1};
      color: ${Colors.GREY_4};
    }
  }
`;

export const IconButtonWrapper = styled.div<{ disabled: boolean }>`
  ${(props) => (props.disabled ? "cursor: not-allowed;" : null)}
  align-items: center;
  display: flex;
}
`;

export const TableStyles = css<{
  cellProperties?: CellLayoutProperties;
  isTextType?: boolean;
}>``;

export const CELL_WRAPPER_LINE_HEIGHT = 28;

export const CellWrapper = styled.div<{
  isHidden?: boolean;
  isHyperLink?: boolean;
  isCellVisible?: boolean;
  isTextType?: boolean;
  compactMode?: string;
  allowCellWrapping?: boolean;
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
  fontStyle?: string;
  textColor?: string;
  cellBackground?: string;
  textSize?: string;
  disablePadding?: boolean;
  imageSize?: ImageSize;
  isCellDisabled?: boolean;
}>`
  display: ${(props) => (props.isCellVisible !== false ? "flex" : "none")};
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  ${(props) => (props.isHidden ? invisible : "")};
  font-weight: ${(props) =>
    props.fontStyle?.includes(FontStyleTypes.BOLD) ? "bold" : "normal"};
  color: ${(props) => props.textColor};
  font-style: ${(props) =>
    props.fontStyle?.includes(FontStyleTypes.ITALIC) ? "italic" : ""};
  text-decoration: ${(props) =>
    props.fontStyle?.includes(FontStyleTypes.UNDERLINE) && props.isTextType
      ? "underline"
      : ""};
  justify-content: ${(props) =>
    props.horizontalAlignment && JUSTIFY_CONTENT[props.horizontalAlignment]};
  text-align: ${(props) =>
    props.horizontalAlignment && TEXT_ALIGN[props.horizontalAlignment]};
  align-items: ${(props) =>
    props.verticalAlignment && ALIGN_ITEMS[props.verticalAlignment]};

  background: ${(props) => {
    if (props.isCellDisabled) {
      return props.cellBackground
        ? lightenColor(props.cellBackground)
        : "var(--wds-color-bg-disabled)";
    } else {
      return props.cellBackground;
    }
  }};

  &:hover,
  .selected-row & {
    background: ${(props) =>
      props.cellBackground && !props.isCellDisabled
        ? darkenColor(props.cellBackground, 5)
        : ""};
  }
  font-size: ${(props) => props.textSize};

  padding: ${(props) =>
    props.disablePadding
      ? 0
      : `${
          props.compactMode
            ? `${TABLE_SIZES[props.compactMode].VERTICAL_PADDING}px 10px`
            : `${0}px 10px`
        }`};
  line-height: ${CELL_WRAPPER_LINE_HEIGHT}px;
  .${Classes.POPOVER_WRAPPER} {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  ${(props) =>
    props.allowCellWrapping
      ? `
        white-space: break-spaces;
        word-break: break-word;
      `
      : `
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;`}
  .image-cell-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: ${(props) =>
      props.verticalAlignment && IMAGE_VERTICAL_ALIGN[props.verticalAlignment]};
    justify-content: ${(props) =>
      props.horizontalAlignment &&
      IMAGE_HORIZONTAL_ALIGN[props.horizontalAlignment]};
  }
  .image-cell {
    height: ${(props) =>
      props.imageSize ? ImageSizes[props.imageSize] : ImageSizes.DEFAULT};
    margin: 0 5px 0 0;
    ${BORDER_RADIUS};
    object-fit: contain;
  }
  video {
    ${BORDER_RADIUS}
  }
  ${(props) =>
    props.isHyperLink &&
    `
    cursor: pointer;
    &:hover {
      color: ${Colors.ROYAL_BLUE};
      text-decoration: underline;
    }`};
  &.video-cell {
    height: 100%;
    iframe {
      border: none;
      ${BORDER_RADIUS}
    }
  }
  .link-text {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
    text-align: ${(props) =>
      props.horizontalAlignment && TEXT_ALIGN[props.horizontalAlignment]};
  }
  .hidden-icon {
    display: none;
  }
  &:hover {
    .hidden-icon {
      display: inline;
    }
  }
`;

export const CellCheckboxWrapper = styled(CellWrapper)<{
  isChecked?: boolean;
  accentColor?: string;
  borderRadius?: string;
}>`
  left: 0;
  z-index: ${Layers.modalWidget};
  justify-content: center;
  width: ${MULTISELECT_CHECKBOX_WIDTH}px;
  height: auto;
  & > div {
    border-radius: ${({ borderRadius }) => borderRadius};

    ${(props) =>
      props.isChecked
        ? `
          background: ${props.accentColor};
          &:hover {
            background: ${darkenColor(props.accentColor)};
          }
            `
        : `
          border: 1px solid ${Colors.GREY_3};
          &:hover {
            border: 1px solid ${Colors.GREY_5};
          }
        `};
  }
`;

export const CellCheckbox = styled.div`
  height: 14px;
  width: 14px;
  background: ${Colors.WHITE};
  cursor: pointer;
  position: relative;
  .th-svg {
    display: block;
    position: absolute;
    left: 2px;
    top: 2px;
  }
`;

export const TableHeaderContentWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${HEADER_CONTROL_FONT_SIZE};
  line-height: 20px;
  color: ${Colors.GRAY};
  margin: 0 4px;
  white-space: nowrap;
`;

export const TableIconWrapper = styled.div<{
  selected?: boolean;
  disabled?: boolean;
}>`
  background: ${(props) =>
    props.selected ? Colors.ATHENS_GRAY : "transparent"};
  box-shadow: ${(props) =>
    props.selected ? `inset 0px 4px 0px ${Colors.GREEN}` : "none"};
  width: 48px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  ${(props) => (props.disabled ? invisible : "")};
  cursor: ${(props) => !props.disabled && "pointer"};
  position: relative;
  &:hover {
    background: ${Colors.ATHENS_GRAY};
  }
`;

export const RenderOptionWrapper = styled.div<{ selected: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 150px;
  position: relative;
  .title {
    color: ${Colors.GREY_10};
    width: 120px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .type {
    position: absolute;
    left: 135px;
    font-size: ${HEADER_CONTROL_FONT_SIZE} !important;
    color: ${Colors.GREY_10};
  }
`;

export const TooltipContentWrapper = styled.div<{ width?: number }>`
  word-break: break-all;
  max-width: ${(props) => props.width}px;
`;

export const EmptyRow = styled.div`
  display: flex;
  flex: 1 0 auto;
`;

export const EmptyCell = styled.div<{ width: number; sticky?: string }>`
  width: ${(props) => props.width}px;
  boxsizing: border-box;
  flex: ${(props) => props.width} 0 auto;
  z-index: ${(props) => (props.sticky ? Layers.dragPreview : 0)};
`;
