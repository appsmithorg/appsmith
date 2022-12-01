import { isString } from "lodash";
import moment from "moment";
import { IconName } from "@blueprintjs/icons";
import { Alignment } from "@blueprintjs/core";
import {
  ButtonBorderRadius,
  ButtonStyleType,
  ButtonVariant,
} from "components/constants";
import { DropdownOption } from "widgets/SelectWidget/constants";
import { ColumnTypes } from "../constants";

export type TableSizes = {
  COLUMN_HEADER_HEIGHT: number;
  TABLE_HEADER_HEIGHT: number;
  ROW_HEIGHT: number;
  ROW_FONT_SIZE: number;
  VERTICAL_PADDING: number;
  EDIT_ICON_TOP: number;
  ROW_VIRTUAL_OFFSET: number;
  VERTICAL_EDITOR_PADDING: number;
};

export enum CompactModeTypes {
  SHORT = "SHORT",
  DEFAULT = "DEFAULT",
  TALL = "TALL",
}

export enum CellAlignmentTypes {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  CENTER = "CENTER",
}

export enum VerticalAlignmentTypes {
  TOP = "TOP",
  BOTTOM = "BOTTOM",
  CENTER = "CENTER",
}

export enum ImageSizes {
  DEFAULT = "32px",
  MEDIUM = "64px",
  LARGE = "128px",
}

export const TABLE_SIZES: { [key: string]: TableSizes } = {
  [CompactModeTypes.DEFAULT]: {
    COLUMN_HEADER_HEIGHT: 32,
    TABLE_HEADER_HEIGHT: 38,
    ROW_HEIGHT: 40,
    ROW_FONT_SIZE: 14,
    VERTICAL_PADDING: 6,
    VERTICAL_EDITOR_PADDING: 0,
    EDIT_ICON_TOP: 10,
    ROW_VIRTUAL_OFFSET: 3,
  },
  [CompactModeTypes.SHORT]: {
    COLUMN_HEADER_HEIGHT: 32,
    TABLE_HEADER_HEIGHT: 38,
    ROW_HEIGHT: 30,
    ROW_FONT_SIZE: 12,
    VERTICAL_PADDING: 0,
    VERTICAL_EDITOR_PADDING: 0,
    EDIT_ICON_TOP: 5,
    ROW_VIRTUAL_OFFSET: 1,
  },
  [CompactModeTypes.TALL]: {
    COLUMN_HEADER_HEIGHT: 32,
    TABLE_HEADER_HEIGHT: 38,
    ROW_HEIGHT: 60,
    ROW_FONT_SIZE: 18,
    VERTICAL_PADDING: 16,
    VERTICAL_EDITOR_PADDING: 16,
    EDIT_ICON_TOP: 21,
    ROW_VIRTUAL_OFFSET: 3,
  },
};

export enum OperatorTypes {
  OR = "OR",
  AND = "AND",
}

export enum SortOrderTypes {
  asc = "asc",
  desc = "desc",
}

export interface TableStyles {
  cellBackground?: string;
  textColor?: string;
  textSize?: string;
  fontStyle?: string;
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
}

export type CompactMode = keyof typeof CompactModeTypes;
export type Condition = keyof typeof ConditionFunctions | "";
export type Operator = keyof typeof OperatorTypes;
export type CellAlignment = keyof typeof CellAlignmentTypes;
export type VerticalAlignment = keyof typeof VerticalAlignmentTypes;
export type ImageSize = keyof typeof ImageSizes;

export interface ReactTableFilter {
  column: string;
  operator: Operator;
  condition: Condition;
  value: any;
}

export interface EditActionCellProperties {
  discardActionIconName?: IconName;
  discardActionLabel?: string;
  discardButtonColor: string;
  discardButtonVariant: ButtonVariant;
  discardBorderRadius: ButtonBorderRadius;
  discardIconAlign: Alignment;
  isDiscardDisabled?: boolean;
  isDiscardVisible?: boolean;
  isSaveDisabled?: boolean;
  isSaveVisible?: boolean;
  saveActionIconName?: IconName;
  saveActionLabel?: string;
  saveButtonColor: string;
  saveButtonVariant: ButtonVariant;
  saveBorderRadius: ButtonBorderRadius;
  saveIconAlign: Alignment;
}

export interface InlineEditingCellProperties {
  isCellEditable: boolean;
  hasUnsavedChanges?: boolean;
}

export interface CellWrappingProperties {
  allowCellWrapping: boolean;
}

export interface ButtonCellProperties {
  buttonVariant: ButtonVariant;
  buttonColor?: string;
  buttonLabel?: string;
  isCompact?: boolean;
  iconName?: IconName;
  iconAlign?: Alignment;
}

export interface MenuButtonCellProperties {
  menuButtonLabel?: string;
  menuItems: MenuItems;
  menuVariant?: ButtonVariant;
  menuColor?: string;
  menuButtoniconName?: IconName;
  onItemClicked?: (onClick: string | undefined) => void;
}

export interface URLCellProperties {
  displayText?: string;
}

export interface SelectCellProperties {
  isFilterable?: boolean;
  serverSideFiltering?: boolean;
  placeholderText?: string;
  resetFilterTextOnClose?: boolean;
  selectOptions?: DropdownOption[];
}

export interface ImageCellProperties {
  imageSize?: ImageSize;
}

export interface BaseCellProperties {
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
  textSize?: string;
  fontStyle?: string;
  textColor?: string;
  cellBackground?: string;
  isVisible?: boolean;
  isDisabled?: boolean;
  borderRadius: string;
  boxShadow: string;
  isCellVisible: boolean;
  isCellDisabled?: boolean;
}

export interface CellLayoutProperties
  extends EditActionCellProperties,
    InlineEditingCellProperties,
    CellWrappingProperties,
    ButtonCellProperties,
    URLCellProperties,
    MenuButtonCellProperties,
    SelectCellProperties,
    ImageCellProperties,
    BaseCellProperties {}

export type MenuItems = Record<
  string,
  {
    widgetId: string;
    id: string;
    index: number;
    isVisible?: boolean;
    isDisabled?: boolean;
    label?: string;
    backgroundColor?: string;
    textColor?: string;
    iconName?: IconName;
    iconColor?: string;
    iconAlign?: Alignment;
    onClick?: string;
  }
>;

export interface TableColumnMetaProps {
  isHidden: boolean;
  format?: string;
  inputFormat?: string;
  type: ColumnTypes;
}

export interface TableColumnProps {
  id: string;
  Header: string;
  alias: string;
  accessor: any;
  width?: number;
  minWidth: number;
  draggable: boolean;
  isHidden?: boolean;
  isAscOrder?: boolean;
  metaProperties?: TableColumnMetaProps;
  isDerived?: boolean;
  columnProperties: ColumnProperties;
}
export interface ReactTableColumnProps extends TableColumnProps {
  Cell: (props: any) => JSX.Element;
}

export interface ColumnBaseProperties {
  id: string;
  originalId: string;
  label?: string;
  columnType: string;
  isVisible: boolean;
  isDisabled?: boolean;
  index: number;
  enableFilter?: boolean;
  enableSort?: boolean;
  isDerived: boolean;
  computedValue: string;
  isCellVisible?: boolean;
  isAscOrder?: boolean;
  alias: string;
  allowCellWrapping: boolean;
}

export interface ColumnStyleProperties {
  width: number;
  cellBackground?: string;
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
  textSize?: string;
  fontStyle?: string;
  textColor?: string;
}

export interface DateColumnProperties {
  outputFormat?: string;
  inputFormat?: string;
}

export interface ColumnEditabilityProperties {
  isCellEditable: boolean; // Cell level editability
  isEditable: boolean; // column level edtitability
  validation?: {
    regex?: string;
    isEditableCellValid?: boolean;
    errorMessage?: string;
    isEditableCellRequired?: boolean;
    min?: number;
    max?: number;
  };
}

export interface EditActionColumnProperties {
  saveButtonVariant?: ButtonVariant;
  saveButtonColor?: string;
  saveIconAlign?: Alignment;
  saveBorderRadius?: ButtonBorderRadius;
  saveActionIconName?: string;
  saveActionLabel?: string;
  isSaveVisible?: boolean;
  isSaveDisabled?: boolean;
  discardButtonVariant?: ButtonVariant;
  discardButtonColor?: string;
  discardIconAlign?: Alignment;
  discardBorderRadius?: ButtonBorderRadius;
  discardActionLabel?: string;
  discardActionIconName?: string;
  isDiscardVisible?: boolean;
  isDiscardDisabled?: boolean;
  isFilterable?: boolean;
  serverSideFiltering?: boolean;
  placeholderText?: string;
  resetFilterTextOnClose?: boolean;
  selectOptions?: DropdownOption[] | DropdownOption[][];
}

export interface ColumnProperties
  extends ColumnBaseProperties,
    ColumnStyleProperties,
    DateColumnProperties,
    ColumnEditabilityProperties,
    EditActionColumnProperties {
  buttonLabel?: string;
  menuButtonLabel?: string;
  buttonColor?: string;
  onClick?: string;
  dropdownOptions?: string;
  onOptionChange?: string;
  displayText?: string;
  buttonVariant?: ButtonVariant;
  isCompact?: boolean;
  menuItems?: MenuItems;
  menuVariant?: ButtonVariant;
  menuColor?: string;
  borderRadius?: ButtonBorderRadius;
  boxShadow?: string;
  boxShadowColor?: string;
  iconName?: IconName;
  menuButtoniconName?: IconName;
  iconAlign?: Alignment;
  onItemClicked?: (onClick: string | undefined) => void;
  iconButtonStyle?: ButtonStyleType;
  imageSize?: ImageSize;
}

export const ConditionFunctions: {
  [key: string]: (a: any, b: any) => boolean;
} = {
  isExactly: (a: any, b: any) => {
    return a.toString() === b.toString();
  },
  empty: (a: any) => {
    return a === "" || a === undefined || a === null;
  },
  notEmpty: (a: any) => {
    return a !== "" && a !== undefined && a !== null;
  },
  notEqualTo: (a: any, b: any) => {
    return a.toString() !== b.toString();
  },
  isEqualTo: (a: any, b: any) => {
    return a.toString() === b.toString();
  },
  lessThan: (a: any, b: any) => {
    const numericB = Number(b);
    const numericA = Number(a);
    return numericA < numericB;
  },
  lessThanEqualTo: (a: any, b: any) => {
    const numericB = Number(b);
    const numericA = Number(a);
    return numericA <= numericB;
  },
  greaterThan: (a: any, b: any) => {
    const numericB = Number(b);
    const numericA = Number(a);
    return numericA > numericB;
  },
  greaterThanEqualTo: (a: any, b: any) => {
    const numericB = Number(b);
    const numericA = Number(a);
    return numericA >= numericB;
  },
  contains: (a: any, b: any) => {
    if (isString(a) && isString(b)) {
      return a.includes(b);
    }
    return false;
  },
  doesNotContain: (a: any, b: any) => {
    if (isString(a) && isString(b)) {
      return !a.includes(b);
    }
    return false;
  },
  startsWith: (a: any, b: any) => {
    if (isString(a) && isString(b)) {
      return a.indexOf(b) === 0;
    }
    return false;
  },
  endsWith: (a: any, b: any) => {
    if (isString(a) && isString(b)) {
      return a.length === a.lastIndexOf(b) + b.length;
    }
    return false;
  },
  is: (a: any, b: any) => {
    return moment(a).isSame(moment(b), "d");
  },
  isNot: (a: any, b: any) => {
    return !moment(a).isSame(moment(b), "d");
  },
  isAfter: (a: any, b: any) => {
    return !moment(a).isAfter(moment(b), "d");
  },
  isBefore: (a: any, b: any) => {
    return !moment(a).isBefore(moment(b), "d");
  },
};

export enum JUSTIFY_CONTENT {
  LEFT = "flex-start",
  CENTER = "center",
  RIGHT = "flex-end",
}

export enum TEXT_ALIGN {
  LEFT = "left",
  CENTER = "center",
  RIGHT = "right",
}

export enum ALIGN_ITEMS {
  TOP = "flex-start",
  CENTER = "center",
  BOTTOM = "flex-end",
}

export enum IMAGE_HORIZONTAL_ALIGN {
  LEFT = "flex-start",
  CENTER = "center",
  RIGHT = "flex-end",
}

export enum IMAGE_VERTICAL_ALIGN {
  TOP = "flex-start",
  CENTER = "center",
  BOTTOM = "flex-end",
}

export type BaseCellComponentProps = {
  compactMode: string;
  isHidden: boolean;
  allowCellWrapping?: boolean;
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
  cellBackground?: string;
  isCellVisible: boolean;
  fontStyle?: string;
  textColor?: string;
  textSize?: string;
  isCellDisabled?: boolean;
};

export enum CheckboxState {
  UNCHECKED = 0,
  CHECKED = 1,
  PARTIAL = 2,
}

export const scrollbarOnHoverCSS = `
  .track-horizontal {
    height: 6px;
    bottom: 1px;
    width: 100%;
    opacity: 0;
    transition: opacity 0.15s ease-in;
    &:active {
      opacity: 1;
    }
  }
  &:hover {
    .track-horizontal {
      opacity: 1;
    }
  }
  .thumb-horizontal {
    &:hover, &:active {
      height: 6px !important;
    }
  }
`;

export const MULTISELECT_CHECKBOX_WIDTH = 40;

export enum AddNewRowActions {
  SAVE = "SAVE",
  DISCARD = "DISCARD",
}

export const EDITABLE_CELL_PADDING_OFFSET = 8;
