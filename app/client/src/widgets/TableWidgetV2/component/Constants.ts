import { isString } from "lodash";
import moment from "moment";
import type { IconName } from "@blueprintjs/icons";
import type { Alignment } from "@blueprintjs/core";
import type {
  ButtonBorderRadius,
  ButtonStyleType,
  ButtonVariant,
} from "components/constants";
import type { DropdownOption } from "widgets/SelectWidget/constants";
import type {
  ConfigureMenuItems,
  MenuItem,
  MenuItems,
  MenuItemsSource,
} from "widgets/MenuButtonWidget/constants";
import type { ColumnTypes } from "../constants";
import type { TimePrecision } from "widgets/DatePickerWidget2/constants";
import { generateReactKey } from "widgets/WidgetUtils";

export interface TableSizes {
  COLUMN_HEADER_HEIGHT: number;
  TABLE_HEADER_HEIGHT: number;
  ROW_HEIGHT: number;
  ROW_FONT_SIZE: number;
  VERTICAL_PADDING: number;
  EDIT_ICON_TOP: number;
  ROW_VIRTUAL_OFFSET: number;
  VERTICAL_EDITOR_PADDING: number;
  EDITABLE_CELL_HEIGHT: number;
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

export enum ImageSizes {
  DEFAULT = "32px",
  MEDIUM = "64px",
  LARGE = "128px",
}

export const TABLE_SIZES: { [key: string]: TableSizes } = {
  [CompactModeTypes.DEFAULT]: {
    COLUMN_HEADER_HEIGHT: 32,
    TABLE_HEADER_HEIGHT: 40,
    ROW_HEIGHT: 40,
    ROW_FONT_SIZE: 14,
    VERTICAL_PADDING: 6,
    VERTICAL_EDITOR_PADDING: 0,
    EDIT_ICON_TOP: 10,
    ROW_VIRTUAL_OFFSET: 3,
    EDITABLE_CELL_HEIGHT: 30,
  },
  [CompactModeTypes.SHORT]: {
    COLUMN_HEADER_HEIGHT: 32,
    TABLE_HEADER_HEIGHT: 40,
    ROW_HEIGHT: 30,
    ROW_FONT_SIZE: 12,
    VERTICAL_PADDING: 0,
    VERTICAL_EDITOR_PADDING: 0,
    EDIT_ICON_TOP: 5,
    ROW_VIRTUAL_OFFSET: 1,
    EDITABLE_CELL_HEIGHT: 20,
  },
  [CompactModeTypes.TALL]: {
    COLUMN_HEADER_HEIGHT: 32,
    TABLE_HEADER_HEIGHT: 40,
    ROW_HEIGHT: 60,
    ROW_FONT_SIZE: 18,
    VERTICAL_PADDING: 16,
    VERTICAL_EDITOR_PADDING: 16,
    EDIT_ICON_TOP: 21,
    ROW_VIRTUAL_OFFSET: 3,
    EDITABLE_CELL_HEIGHT: 30,
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
  id: string;
  column: string;
  operator: Operator;
  condition: Condition;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  menuItemsSource: MenuItemsSource;
  configureMenuItems: ConfigureMenuItems;
  sourceData?: Array<Record<string, unknown>>;
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
  sortBy?: string;
}

export interface ImageCellProperties {
  imageSize?: ImageSize;
}

export interface DateCellProperties {
  inputFormat: string;
  outputFormat: string;
  shortcuts: boolean;
  timePrecision?: TimePrecision;
}

export interface CurrencyCellProperties {
  currencyCode: string;
  decimals: number;
  thousandSeparator: boolean;
  notation: Intl.NumberFormatOptions["notation"];
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
    DateCellProperties,
    CurrencyCellProperties,
    BaseCellProperties {}

export interface TableColumnMetaProps {
  isHidden: boolean;
  format?: string;
  inputFormat?: string;
  type: ColumnTypes;
  decimals?: number;
}

export enum StickyType {
  LEFT = "left",
  RIGHT = "right",
  NONE = "",
}

export const SORT_ORDER = {
  left: -1,
  right: 1,
  none: 0,
};
export interface TableColumnProps {
  id: string;
  Header: string;
  alias: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accessor: any;
  width?: number;
  minWidth: number;
  draggable: boolean;
  isHidden?: boolean;
  isAscOrder?: boolean;
  metaProperties?: TableColumnMetaProps;
  isDerived?: boolean;
  columnProperties: ColumnProperties;
  sticky?: StickyType;
}
export interface ReactTableColumnProps extends TableColumnProps {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  shortcuts?: boolean;
  timePrecision?: TimePrecision;
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
    minDate?: string;
    maxDate?: string;
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
  sortBy?: string;
}

export interface CurrencyColumnProperties {
  currencyCode?: string;
  decimals?: number;
  thousandSeparator?: boolean;
  notation?: Intl.NumberFormatOptions["notation"];
}

export interface ColumnProperties
  extends ColumnBaseProperties,
    ColumnStyleProperties,
    DateColumnProperties,
    ColumnEditabilityProperties,
    CurrencyColumnProperties,
    EditActionColumnProperties {
  allowSameOptionsInNewRow?: boolean;
  newRowSelectOptions?: DropdownOption[];
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
  sticky?: StickyType;
  getVisibleItems?: () => Array<MenuItem>;
  menuItemsSource?: MenuItemsSource;
  configureMenuItems?: ConfigureMenuItems;
  sourceData?: Array<Record<string, unknown>>;
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
    return moment(a).isSame(moment(b), "d");
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isNot: (a: any, b: any) => {
    return !moment(a).isSame(moment(b), "d");
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isAfter: (a: any, b: any) => {
    return !moment(a).isAfter(moment(b), "d");
  },
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export interface BaseCellComponentProps {
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
}

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

export const TABLE_SCROLLBAR_WIDTH = 10;
export const TABLE_SCROLLBAR_HEIGHT = 8;

export const POPOVER_ITEMS_TEXT_MAP = {
  SORT_ASC: "Sort column ascending",
  SORT_DSC: "Sort column descending",
  FREEZE_LEFT: "Freeze column left",
  FREEZE_RIGHT: "Freeze column right",
};

export const HEADER_MENU_PORTAL_CLASS = ".header-menu-portal";
export const MENU_CONTENT_CLASS = ".menu-content";
export const DEFAULT_FILTER = {
  id: generateReactKey(),
  column: "",
  operator: OperatorTypes.OR,
  value: "",
  condition: "",
};

export const itemHeight = 45;

export const noOfItemsToDisplay = 4;

// 12px for the (noOfItemsToDisplay+ 1) item to let the user know there are more items to scroll
export const extraSpace = 12;

export enum TableSelectColumnOptionKeys {
  LABEL = "label",
  VALUE = "value",
}
