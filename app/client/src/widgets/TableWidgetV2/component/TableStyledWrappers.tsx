import styled, { css } from "styled-components";
import {
  TableSizes,
  CellLayoutProperties,
  JUSTIFY_CONTENT,
  ALIGN_ITEMS,
  IMAGE_HORIZONTAL_ALIGN,
  IMAGE_VERTICAL_ALIGN,
  TEXT_ALIGN,
  TABLE_SIZES,
  CellAlignment,
  VerticalAlignment,
} from "./Constants";
import { Colors, Color } from "constants/Colors";
import { hideScrollbar, invisible } from "constants/DefaultTheme";
import { lightenColor, darkenColor } from "widgets/WidgetUtils";
import { FontStyleTypes } from "constants/WidgetConstants";
import { Classes } from "@blueprintjs/core";

const OFFSET_WITHOUT_HEADER = 40;
const OFFSET_WITH_HEADER = 80;
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
}>`
  width: 100%;
  height: 100%;
  background: white;
  border: ${({ boxShadow }) =>
    boxShadow === "none" ? `1px solid ${Colors.GEYSER_LIGHT}` : `none`};
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => `${boxShadow}`} !important;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  overflow: hidden;
  .tableWrap {
    height: 100%;
    display: block;
    position: relative;
    width: ${(props) => props.width}px;
    overflow-x: auto;
    ${hideScrollbar};
    .thumb-horizontal {
      height: 4px !important;
      border-radius: ${(props) => props.theme.radii[3]}px;
      background: ${(props) => props.theme.colors.scrollbarLight} !important;
      &:hover {
        height: 6px !important;
      }
    }
  }
  .table {
    border-spacing: 0;
    color: ${Colors.THUNDER};
    position: relative;
    background: ${Colors.ATHENS_GRAY_DARKER};
    display: table;
    width: 100%;
    ${hideScrollbar};
    .thead,
    .tbody {
      overflow: hidden;
    }
    .tbody {
      height: ${(props) =>
        props.isHeaderVisible
          ? props.height - OFFSET_WITH_HEADER
          : props.height - OFFSET_WITHOUT_HEADER}px;
      width: 100%;
      overflow-y: auto;
      ${hideScrollbar};
    }
    .tr {
      overflow: hidden;
      cursor: ${(props) => props.triggerRowSelection && "pointer"};
      background: ${Colors.WHITE};
      &.selected-row {
        background: ${({ accentColor }) =>
          `${lightenColor(accentColor)}`} !important;
      }
      &:hover {
        background: ${({ accentColor }) =>
          `${lightenColor(accentColor)}`} !important;
      }
    }
    .th,
    .td {
      margin: 0;
      border-bottom: 1px solid ${Colors.GEYSER_LIGHT};
      border-right: 1px solid ${Colors.GEYSER_LIGHT};
      position: relative;
      font-size: ${(props) => props.tableSizes.ROW_FONT_SIZE}px;
      line-height: ${(props) => props.tableSizes.ROW_FONT_SIZE}px;
      :last-child {
        border-right: 0;
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
    }
    .th {
      padding: 0 10px 0 0;
      height: ${(props) =>
        props.isHeaderVisible ? props.tableSizes.COLUMN_HEADER_HEIGHT : 40}px;
      line-height: ${(props) =>
        props.isHeaderVisible ? props.tableSizes.COLUMN_HEADER_HEIGHT : 40}px;
      background: ${Colors.ATHENS_GRAY_DARKER};
    }
    .td {
      min-height: ${(props) => props.tableSizes.ROW_HEIGHT}px;
      padding: 0;
    }
    .thead {
      position: sticky;
      top: 0;
      z-index: 1;
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
    font-weight: 500;
    padding-left: 10px;
    &.sorted {
      padding-left: 5px;
    }
  }
  .draggable-header {
    cursor: pointer;
    display: inline-block;
    width: 100%;
    height: 38px;
    &.reorder-line {
      width: 1px;
      height: 100%;
    }
  }
  .hidden-header {
    ${invisible};
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
  padding: 8px 20px;
  color: ${Colors.GRAY};
`;

export const PaginationItemWrapper = styled.div<{
  disabled?: boolean;
  selected?: boolean;
  borderRadius: string;
  accentColor: string;
}>`
  background: ${(props) => (props.disabled ? Colors.MERCURY : Colors.WHITE)};
  border: 1px solid ${Colors.ALTO2};
  box-sizing: border-box;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 4px;
  pointer-events: ${(props) => props.disabled && "none"};
  cursor: pointer;
  border-radius: ${({ borderRadius }) => borderRadius};
  &:hover {
    border-color: ${({ accentColor }) => accentColor};
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
  background: ${(props) => props.cellBackground};
  font-size: ${(props) => props.textSize};

  padding: ${(props) =>
    props.compactMode ? TABLE_SIZES[props.compactMode].VERTICAL_PADDING : 0}px
    10px;
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
  }
  .image-cell {
    width: 100%;
    height: 100%;
    margin: 0 5px 0 0;
    ${BORDER_RADIUS}
    background-position-x: ${(props) =>
      props.horizontalAlignment &&
      IMAGE_HORIZONTAL_ALIGN[props.horizontalAlignment]};
    background-position-y: ${(props) =>
      props.verticalAlignment && IMAGE_VERTICAL_ALIGN[props.verticalAlignment]};
    background-repeat: no-repeat;
    background-size: contain;
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
  accentColor: string;
  borderRadius: string;
}>`
  justify-content: center;
  width: 40px;
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
  width: ${(props) => props.width - 8}px;
  .show-page-items {
    display: ${(props) =>
      props.width < MIN_WIDTH_TO_SHOW_PAGE_ITEMS ? "none" : "flex"};
  }
  height: ${(props) => props.tableSizes.TABLE_HEADER_HEIGHT}px;
  min-height: ${(props) => props.tableSizes.TABLE_HEADER_HEIGHT}px;
  overflow-x: auto;
  ${hideScrollbar};
  .thumb-horizontal {
    height: 4px !important;
    border-radius: ${(props) => props.theme.radii[3]}px;
    background: ${(props) => props.theme.colors.scrollbarLight};
    &:hover {
      height: 6px !important;
    }
  }
`;

export const TableHeaderInnerWrapper = styled.div<{
  serverSidePaginationEnabled: boolean;
  width: number;
  tableSizes: TableSizes;
  backgroundColor?: Color;
}>`
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  border-bottom: 1px solid ${Colors.GEYSER_LIGHT};
`;

export const CommonFunctionsMenuWrapper = styled.div<{
  tableSizes: TableSizes;
}>`
  display: flex;
  align-items: center;
  height: ${(props) => props.tableSizes.TABLE_HEADER_HEIGHT}px;
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

export const EmptyCell = styled.div<{ width: number }>`
  width: ${(props) => props.width}px;
  boxsizing: border-box;
  flex: ${(props) => props.width} 0 auto;
`;
