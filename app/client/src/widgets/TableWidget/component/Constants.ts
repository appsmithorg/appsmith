import { isString } from "lodash";
import moment from "moment";
import type { IconName } from "@blueprintjs/icons";
import type { Alignment } from "@blueprintjs/core";
import type {
  ButtonBorderRadius,
  ButtonStyleType,
  ButtonVariant,
} from "components/constants";

export interface TableSizes {
  COLUMN_HEADER_HEIGHT: number;
  TABLE_HEADER_HEIGHT: number;
  ROW_HEIGHT: number;
  ROW_FONT_SIZE: number;
}

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

export interface ReactTableFilter {
  column: string;
  operator: Operator;
  condition: Condition;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}

export interface CellLayoutProperties {
  horizontalAlignment?: CellAlignment;
  verticalAlignment?: VerticalAlignment;
  textSize?: string;
  fontStyle?: string;
  textColor?: string;
  cellBackground?: string;
  buttonColor?: string;
  buttonLabel?: string;
  menuButtonLabel?: string;
  isVisible?: boolean;
  isDisabled?: boolean;
  displayText?: string;
  buttonVariant: ButtonVariant;
  borderRadius: string;
  boxShadow: string;
  isCellVisible: boolean;
  isCompact?: boolean;
  menuItems: MenuItems;
  menuVariant?: ButtonVariant;
  menuColor?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  onItemClicked?: (onClick: string | undefined) => void;
  buttonLabelColor?: string;
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  textSize?: string;
  fontStyle?: string;
  textColor?: string;
  enableFilter?: boolean;
  enableSort?: boolean;
  isDerived: boolean;
  computedValue: string;
  buttonLabel?: string;
  menuButtonLabel?: string;
  buttonColor?: string;
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
  boxShadow?: string;
  boxShadowColor?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  onItemClicked?: (onClick: string | undefined) => void;
  iconButtonStyle?: ButtonStyleType;
  isCellVisible?: boolean;
}

export const ConditionFunctions: {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (a: any, b: any) => boolean;
} = {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isExactly: (a: any, b: any) => {
    return a.toString() === b.toString();
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  empty: (a: any) => {
    return a === "" || a === undefined || a === null;
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notEmpty: (a: any) => {
    return a !== "" && a !== undefined && a !== null;
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notEqualTo: (a: any, b: any) => {
    return a.toString() !== b.toString();
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isEqualTo: (a: any, b: any) => {
    return a.toString() === b.toString();
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lessThan: (a: any, b: any) => {
    const numericB = Number(b);
    const numericA = Number(a);

    return numericA < numericB;
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lessThanEqualTo: (a: any, b: any) => {
    const numericB = Number(b);
    const numericA = Number(a);

    return numericA <= numericB;
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  greaterThan: (a: any, b: any) => {
    const numericB = Number(b);
    const numericA = Number(a);

    return numericA > numericB;
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  greaterThanEqualTo: (a: any, b: any) => {
    const numericB = Number(b);
    const numericA = Number(a);

    return numericA >= numericB;
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contains: (a: any, b: any) => {
    if (isString(a) && isString(b)) {
      return a.includes(b);
    }

    return false;
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doesNotContain: (a: any, b: any) => {
    if (isString(a) && isString(b)) {
      return !a.includes(b);
    }

    return false;
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startsWith: (a: any, b: any) => {
    if (isString(a) && isString(b)) {
      return a.indexOf(b) === 0;
    }

    return false;
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  endsWith: (a: any, b: any) => {
    if (isString(a) && isString(b)) {
      return a.length === a.lastIndexOf(b) + b.length;
    }

    return false;
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  is: (a: any, b: any) => {
    try {
      return isSameDay(parseISO(a), parseISO(b));
    } catch (e) {
      return false;
    }
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isNot: (a: any, b: any) => {
    try {
      return !isSameDay(parseISO(a), parseISO(b));
    } catch (e) {
      return false;
    }
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isAfter: (a: any, b: any) => {
    try {
      return isAfter(parseISO(a), parseISO(b));
    } catch (e) {
      return false;
    }
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isBefore: (a: any, b: any) => {
    try {
      return isBefore(parseISO(a), parseISO(b));
    } catch (e) {
      return false;
    }
  },
};
