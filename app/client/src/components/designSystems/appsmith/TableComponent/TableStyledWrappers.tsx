import styled, { css } from "styled-components";
import {
  TableSizes,
  CellLayoutProperties,
  FontStyleTypes,
} from "components/designSystems/appsmith/TableComponent/Constants";
import { Colors, Color } from "constants/Colors";

export const TableWrapper = styled.div<{
  width: number;
  height: number;
  tableSizes: TableSizes;
  backgroundColor?: Color;
  triggerRowSelection: boolean;
}>`
  width: 100%;
  height: 100%;
  background: white;
  border: 1px solid ${Colors.GEYSER_LIGHT};
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  overflow: hidden;
  .tableWrap {
    height: 100%;
    display: block;
    overflow: auto;
  }
  .table {
    border-spacing: 0;
    color: ${Colors.THUNDER};
    position: relative;
    background: ${Colors.ATHENS_GRAY_DARKER};
    display: table;
    width: 100%;
    .thead,
    .tbody {
      overflow: hidden;
    }
    .tbody {
      .tr {
        width: 100%;
      }
    }
    .tr {
      overflow: hidden;
      cursor: ${(props) => props.triggerRowSelection && "pointer"};
      background: ${Colors.WHITE};
      &.selected-row {
        & > .td > div {
          background: ${Colors.POLAR}!important;
        }
        background: ${Colors.POLAR}!important;
        &:hover {
          background: ${Colors.POLAR};
        }
      }
      &:hover {
        background: ${Colors.ATHENS_GRAY};
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
      height: ${(props) => props.tableSizes.COLUMN_HEADER_HEIGHT}px;
      line-height: ${(props) => props.tableSizes.COLUMN_HEADER_HEIGHT}px;
      background: ${Colors.ATHENS_GRAY_DARKER};
    }
    .td {
      height: ${(props) => props.tableSizes.ROW_HEIGHT}px;
      line-height: ${(props) => props.tableSizes.ROW_HEIGHT}px;
      padding: 0;
    }
    .thead {
      position: sticky;
      top: 0;
      z-index: 1;
    }
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
    width: calc(100% - 20px);
    height: 38px;
    &.reorder-line {
      width: 1px;
      height: 100%;
    }
  }
  .hidden-header {
    opacity: 0.6;
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
  border-radius: 4px;
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
  border-radius: 4px;
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
`;

export const PaginationItemWrapper = styled.div<{
  disabled?: boolean;
  selected?: boolean;
}>`
  background: ${(props) =>
    props.disabled ? Colors.ATHENS_GRAY : Colors.WHITE};
  border: 1px solid
    ${(props) => (props.selected ? Colors.GREEN : Colors.GEYSER_LIGHT)};
  box-sizing: border-box;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 4px;
  pointer-events: ${(props) => props.disabled && "none"};
  cursor: pointer;
  &:hover {
    border-color: ${Colors.GREEN};
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

export const ActionWrapper = styled.div<{
  background: string;
  buttonLabelColor: string;
}>`
  margin: 0 5px 0 0;
  &&&&&& {
    .bp3-button {
      background: ${(props) => props.background};
      color: ${(props) => props.buttonLabelColor};
      border: none;
    }
    .bp3-button span {
      font-weight: 400;
    }
  }
`;

const JUSTIFY_CONTENT = {
  LEFT: "flex-start",
  CENTER: "center",
  RIGHT: "flex-end",
};

const ALIGN_ITEMS = {
  TOP: "flex-start",
  CENTER: "center",
  BOTTOM: "flex-end",
};

const TEXT_SIZES = {
  HEADING1: "24px",
  HEADING2: "18px",
  HEADING3: "16px",
  PARAGRAPH: "14px",
  PARAGRAPH2: "12px",
};

export const TableStyles = css<{ cellProperties?: CellLayoutProperties }>`
  font-weight: ${(props) =>
    props?.cellProperties?.fontStyle?.includes(FontStyleTypes.BOLD)
      ? "bold"
      : "normal"};
  color: ${(props) => props?.cellProperties?.textColor};
  font-style: ${(props) =>
    props?.cellProperties?.fontStyle?.includes(FontStyleTypes.ITALIC)
      ? "italic"
      : ""};
  text-decoration: ${(props) =>
    props?.cellProperties?.fontStyle?.includes(FontStyleTypes.UNDERLINE)
      ? "underline"
      : ""};
  justify-content: ${(props) =>
    props?.cellProperties?.horizontalAlignment &&
    JUSTIFY_CONTENT[props?.cellProperties?.horizontalAlignment]};
  align-items: ${(props) =>
    props?.cellProperties?.verticalAlignment &&
    ALIGN_ITEMS[props?.cellProperties?.verticalAlignment]};
  background: ${(props) => props?.cellProperties?.cellBackground};
  font-size: ${(props) =>
    props?.cellProperties?.textSize &&
    TEXT_SIZES[props?.cellProperties?.textSize]};
`;

export const CellWrapper = styled.div<{
  isHidden?: boolean;
  cellProperties?: CellLayoutProperties;
}>`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: ${(props) => (props.isHidden ? "0.6" : "1")};
  ${TableStyles};
  padding: 0 10px;
  line-height: 28px;
  .image-cell-wrapper {
    width: 100%;
    height: 100%;
  }
  .image-cell {
    width: 100%;
    height: 100%;
    margin: 0 5px 0 0;
    border-radius: 4px;
    background-position: start;
    background-repeat: no-repeat;
    background-size: contain;
  }
  video {
    border-radius: 4px;
  }
  &.video-cell {
    height: 100%;
    iframe {
      border: none;
      border-radius: 4px;
    }
  }
`;

export const TableHeaderWrapper = styled.div<{
  serverSidePaginationEnabled: boolean;
  width: number;
  tableSizes: TableSizes;
  backgroundColor?: Color;
}>`
  display: flex;
  border-bottom: 1px solid ${Colors.GEYSER_LIGHT};
  width: ${(props) => props.width}px;
  .show-page-items {
    display: ${(props) => (props.width < 700 ? "none" : "flex")};
  }
  overflow-x: auto;
  overflow-y: hidden;
  height: ${(props) => props.tableSizes.TABLE_HEADER_HEIGHT}px;
  min-height: ${(props) => props.tableSizes.TABLE_HEADER_HEIGHT}px;
`;

export const CommonFunctionsMenuWrapper = styled.div<{
  tableSizes: TableSizes;
}>`
  display: flex;
  align-items: center;
  height: ${(props) => props.tableSizes.TABLE_HEADER_HEIGHT}px;
`;

export const RowWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 20px;
  color: ${Colors.THUNDER};
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
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  cursor: ${(props) => !props.disabled && "pointer"};
  position: relative;
  &:hover {
    background: ${Colors.ATHENS_GRAY};
  }
`;

export const SortIconWrapper = styled.div`
  display: inline-block;
  height: 38px;
  line-height: 38px;
`;

export const RenderOptionWrapper = styled.div<{ selected: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 150px;
  background: ${(props) => props.selected && Colors.GREEN};
  position: relative;
  .title {
    color: ${(props) => (props.selected ? Colors.WHITE : Colors.OXFORD_BLUE)};
    width: 120px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .type {
    position: absolute;
    left: 135px;
    font-size: 12px !important;
    color: ${(props) => (props.selected ? Colors.WHITE : Colors.BLUE_BAYOUX)};
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
