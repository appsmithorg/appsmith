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
  TABLE_SCROLLBAR_HEIGHT,
  TABLE_SCROLLBAR_WIDTH,
} from "./Constants";
import type { Color } from "constants/Colors";
import { Colors } from "constants/Colors";
import { hideScrollbar, invisible } from "constants/DefaultTheme";
import { lightenColor, darkenColor } from "widgets/WidgetUtils";
import { FontStyleTypes } from "constants/WidgetConstants";
import { Classes } from "@blueprintjs/core";
import type { TableVariant } from "../constants";
import { TableVariantTypes } from "../constants";
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
  multiRowSelection?: boolean;
}>`
  width: 100%;
  height: 100%;
  background: white;
  border-style: solid;
  border-width: ${({ borderWidth }) => `${borderWidth}px`};
  border-color: ${({ borderColor }) => borderColor};
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  overflow: hidden;
  .simplebar-track {
    opacity: 0.7;
    &.simplebar-horizontal {
      height: ${TABLE_SCROLLBAR_HEIGHT}px;
      .simplebar-scrollbar {
        height: 5px;
      }
      &.simplebar-hover {
        height: 10px;
        & .simplebar-scrollbar {
          height: 8px;
        }
      }
    }

    &.simplebar-vertical {
      direction: rtl;
      top: ${(props) => props.tableSizes.TABLE_HEADER_HEIGHT - 10}px;
      width: ${TABLE_SCROLLBAR_WIDTH}px;
      &.simplebar-hover {
        width: 10px;
        & .simplebar-scrollbar {
          width: 11px;
        }
      }
    }
  }
  .tableWrap {
    height: 100%;
    display: block;
    position: relative;
    width: ${({ width }) => width}px;
    overflow: auto hidden;
    &.virtual {
      ${hideScrollbar};
    }
  }
  .table {
    border-spacing: 0;
    color: ${Colors.THUNDER};
    position: relative;
    display: table;
    width: 100%;
    ${hideScrollbar};
    .tbody {
      height: fit-content;
      width: fit-content;
    }
    .tr {
      cursor: ${(props) => props.triggerRowSelection && "pointer"};
      background: ${Colors.WHITE};
      &.selected-row {
        background: ${({ accentColor }) =>
          `${lightenColor(accentColor)}`} !important;

        &:hover {
          background: ${({ accentColor }) =>
            `${lightenColor(accentColor, "0.9")}`} !important;
        }
      }

      ${(props) => {
        if (!props.isAddRowInProgress) {
          return `&:hover {
            background: var(--wds-color-bg-hover) !important;
          }`;
        }
      }}
      &.new-row {
        background: ${({ accentColor }) =>
          `${lightenColor(accentColor)}`} !important;
      }
    }
    .th,
    .td {
      margin: 0;
      position: relative;
      border-right: ${(props) =>
        props.variant === TableVariantTypes.DEFAULT ||
        props.variant === undefined ||
        props.isResizingColumn
          ? "1px solid var(--wds-color-border-onaccent)"
          : "none"};
      position: relative;
      font-size: ${(props) => props.tableSizes.ROW_FONT_SIZE}px;
      line-height: ${(props) => props.tableSizes.ROW_FONT_SIZE}px;
      :last-child {
        border-right: 0;
        .resizer {
          right: 5px;
        }
      }
      .resizer {
        display: inline-block;
        width: 10px;
        height: 100%;
        position: absolute;
        right: 0;
        top: 0;
        transform: translateX(50%);
        z-index: 1;
        ${"" /* prevents from scrolling while dragging on touch devices */}
        touch-action:none;
        &.isResizing {
          cursor: isResizing;
        }
      }

      &:after {
        content: "";
        position: absolute;
        right: 0;
        bottom: 0;
        width: 100%;
        border-bottom: ${(props) =>
          props.variant === TableVariantTypes.DEFAULT ||
          props.variant === undefined ||
          props.variant === TableVariantTypes.VARIANT3
            ? "1px solid var(--wds-color-border-onaccent)"
            : "none"};
      }
    }

    .th {
      font-size: 14px;
    }

    .th {
      padding: 0 10px 0 0;
      height: ${(props) =>
        props.isHeaderVisible ? props.tableSizes.COLUMN_HEADER_HEIGHT : 40}px;
      line-height: ${(props) =>
        props.isHeaderVisible ? props.tableSizes.COLUMN_HEADER_HEIGHT : 40}px;
      background: var(--wds-color-bg);
      font-weight: bold;
    }
    .td {
      min-height: ${(props) => props.tableSizes.ROW_HEIGHT}px;
      padding: 0;
    }
    .thead {
      position: sticky;
      top: 0;
      z-index: 1;
      width: fit-content;
    }
  }

  .virtual-list {
    ${hideScrollbar};
  }

  .column-freeze {
    .body {
      position: relative;
      z-index: 0;
    }

    [role="columnheader"] {
      background-color: var(--wds-color-bg) !important;
    }

    [data-sticky-td] {
      position: sticky;
      position: -webkit-sticky;
      background-color: inherit;
      border-bottom: ${(props) =>
        props.variant === TableVariantTypes.VARIANT2
          ? "none"
          : "1px solid var(--wds-color-border-onaccent)"};
      & .draggable-header {
        cursor: pointer;
      }
      &.hidden-cell,
      &:has(> .hidden-header) {
        z-index: 0;
        position: unset !important;
      }

      &:has(> .hidden-header) .resizer {
        position: relative;
      }
    }

    [data-sticky-last-left-td] {
      left: 0px;
      border-right: 3px solid var(--wds-color-border);
      &.hidden-cell,
      &:has(> .hidden-header) {
        border-right: 0.5px solid var(--wds-color-border);
      }
    }

    [data-sticky-first-right-td] {
      right: 0px;
      border-left: 3px solid var(--wds-color-border);
      &.hidden-cell,
      &:has(> .hidden-header) {
        border-left: none;
      }
    }

    & .sticky-right-modifier {
      border-left: 3px solid var(--wds-color-border);
    }
  }

  .tbody .tr:last-child .td {
    border-bottom: none;
  }

  .draggable-header,
  .hidden-header {
    width: 100%;
    text-overflow: ellipsis;
    overflow: hidden;
    color: ${Colors.OXFORD_BLUE};
    padding-left: 10px;
    &.sorted {
      padding-left: 5px;
    }
  }
  .draggable-header {
    cursor: grab;
    display: inline-block;
    width: 100%;
    height: ${(props) => props.tableSizes.COLUMN_HEADER_HEIGHT};
    &.reorder-line {
      width: 1px;
      height: 100%;
    }
  }
  .hidden-header {
    opacity: 0.6;

    ${invisible};
  }
  .header-menu {
    cursor: pointer;
    width: 24px;
    display: flex;
    align-items: center;
    .bp3-popover2-target {
      display: block;
    }

    &.hide-menu {
      display: none;
    }

    &.hide {
      &:hover {
        .bp3-popover2-target {
          display: block;
        }
      }
      .bp3-popover2-target {
        display: none;
      }
    }
  }
  .column-menu {
    cursor: pointer;
    height: ${(props) => props.tableSizes.COLUMN_HEADER_HEIGHT}px;
    line-height: ${(props) => props.tableSizes.COLUMN_HEADER_HEIGHT}px;
  }
  .th {
    display: flex !important;
    justify-content: space-between;
    &.highlight-left {
      border-left: 2px solid ${Colors.GREEN};
    }
    &.highlight-right {
      border-right: 2px solid ${Colors.GREEN};
    }
    & .draggable-header--dragging {
      background: #efefef;
      border-radius: 4px;
      z-index: 100;
      width: 100%;
      text-overflow: none;
      overflow: none;
    }
  }
  .input-group {
    height: ${(props) => props.tableSizes.COLUMN_HEADER_HEIGHT}px;
    line-height: ${(props) => props.tableSizes.COLUMN_HEADER_HEIGHT}px;
    padding: 0 5px;
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

export const IconOptionWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  cursor: pointer;
`;

export const PaginationWrapper = styled.div`
  box-sizing: border-box;
  display: flex;
  width: 100%;
  justify-content: flex-end;
  align-items: center;
  padding: 8px;
  color: var(--wds-color-text-light);
`;

export const PaginationItemWrapper = styled.div<{
  disabled?: boolean;
  selected?: boolean;
  borderRadius: string;
  accentColor: string;
}>`
  background: ${(props) =>
    props.disabled ? `var(--wds-color-bg-disabled)` : `var(--wds-color-bg)`};
  border: 1px solid
    ${(props) =>
      props.disabled
        ? `var(--wds-color-border-disabled)`
        : `var(--wds-color-border)`};
  box-sizing: border-box;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 4px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  border-radius: ${({ borderRadius }) => borderRadius};

  & > * {
    pointer-events: ${(props) => props.disabled && "none"};
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  & svg {
    fill: ${(props) =>
      props.disabled
        ? `var(--wds-color-icon-disabled)`
        : `var(--wds-color-icon)`};
  }
  ${({ disabled }) =>
    !disabled &&
    `&:hover {
    border-color: var(--wds-color-border-hover);
    background-color: var(--wds-color-bg-hover);
  }`}
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
  max-width: 100%;
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
    ${BORDER_RADIUS}
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

const MIN_WIDTH_TO_SHOW_PAGE_ITEMS = 700;

export const TableHeaderWrapper = styled.div<{
  serverSidePaginationEnabled: boolean;
  width: number;
  tableSizes: TableSizes;
  backgroundColor?: Color;
}>`
  position: relative;
  display: flex;
  width: 100%;
  .show-page-items {
    display: ${(props) =>
      props.width < MIN_WIDTH_TO_SHOW_PAGE_ITEMS ? "none" : "flex"};
  }
  height: ${(props) => props.tableSizes.TABLE_HEADER_HEIGHT}px;
  min-height: ${(props) => props.tableSizes.TABLE_HEADER_HEIGHT}px;
`;

export const TableHeaderInnerWrapper = styled.div<{
  serverSidePaginationEnabled: boolean;
  width: number;
  tableSizes: TableSizes;
  backgroundColor?: Color;
  variant?: TableVariant;
}>`
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  border-bottom: ${(props) =>
    props.variant !== "VARIANT2" &&
    `1px solid var(--wds-color-border-onaccent)`};
`;

export const CommonFunctionsMenuWrapper = styled.div<{
  tableSizes: TableSizes;
}>`
  display: flex;
  align-items: center;
  height: 100%;

  & .bp3-popover-target,
  & .bp3-popover-wrapper {
    height: 100%;
  }

  & .bp3-popover-target {
    display: flex;
    align-items: center;
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

export const MenuCategoryWrapper = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  color: ${Colors.RIVER_BED};
`;

export const MenuStyledOptionHeader = styled.div`
  font-weight: 600;
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
