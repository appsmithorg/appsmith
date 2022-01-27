import { isString } from "lodash";
import moment from "moment";
import { TextSize } from "constants/WidgetConstants";
import { IconName } from "@blueprintjs/icons";
import { Alignment } from "@blueprintjs/core";
import {
  ButtonBorderRadius,
  ButtonBoxShadow,
  ButtonStyleType,
  ButtonVariant,
} from "components/constants";

export type TableSizes = {
  COLUMN_HEADER_HEIGHT: number;
  TABLE_HEADER_HEIGHT: number;
  ROW_HEIGHT: number;
  ROW_FONT_SIZE: number;
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

export const TABLE_SIZES: { [key: string]: TableSizes } = {
  [CompactModeTypes.DEFAULT]: {
    COLUMN_HEADER_HEIGHT: 32,
    TABLE_HEADER_HEIGHT: 38,
    ROW_HEIGHT: 40,
    ROW_FONT_SIZE: 14,
  },
  [CompactModeTypes.SHORT]: {
    COLUMN_HEADER_HEIGHT: 32,
    TABLE_HEADER_HEIGHT: 38,
    ROW_HEIGHT: 20,
    ROW_FONT_SIZE: 12,
  },
  [CompactModeTypes.TALL]: {
    COLUMN_HEADER_HEIGHT: 32,
    TABLE_HEADER_HEIGHT: 38,
    ROW_HEIGHT: 60,
    ROW_FONT_SIZE: 18,
  },
};

export enum ColumnTypes {
  DATE = "date",
  VIDEO = "video",
  IMAGE = "image",
  TEXT = "text",
  NUMBER = "number",
  URL = "url",
}

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
  textSize?: TextSize;
  fontStyle?: string;
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
}

export type CompactMode = keyof typeof CompactModeTypes;
export type Condition = keyof typeof ConditionFunctions | "";
export type Operator = keyof typeof OperatorTypes;
export type CellAlignment = keyof typeof CellAlignmentTypes;
export type VerticalAlignment = keyof typeof VerticalAlignmentTypes;

export interface ReactTableFilter {
  column: string;
  operator: Operator;
  condition: Condition;
  value: any;
}

export interface CellLayoutProperties {
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
  textSize?: TextSize;
  fontStyle?: string;
  textColor?: string;
  cellBackground?: string;
  buttonColor?: string;
  buttonLabelColor?: string;
  buttonLabel?: string;
  menuButtonLabel?: string;
  isVisible?: boolean;
  isDisabled?: boolean;
  displayText?: string;
  buttonVariant: ButtonVariant;
  borderRadius: ButtonBorderRadius;
  boxShadow: ButtonBoxShadow;
  boxShadowColor: string;
  isCellVisible: boolean;
  isCompact?: boolean;
  menuItems: MenuItems;
  menuVariant?: ButtonVariant;
  menuColor?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  onItemClicked?: (onClick: string | undefined) => void;
}

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
  type: string;
}

export interface TableColumnProps {
  Header: string;
  accessor: string;
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

export interface ColumnProperties {
  id: string;
  label?: string;
  columnType: string;
  isVisible: boolean;
  isDisabled?: boolean;
  index: number;
  width: number;
  cellBackground?: string;
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
  textSize?: TextSize;
  fontStyle?: string;
  textColor?: string;
  enableFilter?: boolean;
  enableSort?: boolean;
  isDerived: boolean;
  computedValue: string;
  buttonLabel?: string;
  menuButtonLabel?: string;
  buttonColor?: string;
  buttonLabelColor?: string;
  onClick?: string;
  outputFormat?: string;
  inputFormat?: string;
  dropdownOptions?: string;
  onOptionChange?: string;
  displayText?: string;
  buttonVariant?: ButtonVariant;
  isCompact?: boolean;
  menuItems?: MenuItems;
  menuVariant?: ButtonVariant;
  menuColor?: string;
  borderRadius?: ButtonBorderRadius;
  boxShadow?: ButtonBoxShadow;
  boxShadowColor?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  onItemClicked?: (onClick: string | undefined) => void;
  iconButtonStyle?: ButtonStyleType;
  isCellVisible?: boolean;
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
