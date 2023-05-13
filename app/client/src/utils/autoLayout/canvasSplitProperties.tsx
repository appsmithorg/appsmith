import React from "react";
import { Icon, importSvg } from "design-system-old";
import { ValidationTypes } from "constants/WidgetValidation";

interface CanvasSplitOptionType {
  label: string;
  value: CanvasSplitTypes;
  icon: any;
}

const Column100 = importSvg(() => import("assets/icons/control/1-column.svg"));
const Column25_75 = importSvg(
  () => import("assets/icons/control/2-column-25-75.svg"),
);
const Column50_50 = importSvg(
  () => import("assets/icons/control/2-column-50-50.svg"),
);
const Column75_25 = importSvg(
  () => import("assets/icons/control/2-column-75-25.svg"),
);

export type CanvasSplitTypes =
  | "1-column"
  | "2-column-50-50"
  | "2-column-25-75"
  | "2-column-75-25"
  | "2-column-custom";

const CanvasSplitRatio: { [key in CanvasSplitTypes]: number[] } = {
  "1-column": [1],
  "2-column-50-50": [0.5, 0.5],
  "2-column-25-75": [0.25, 0.75],
  "2-column-75-25": [0.75, 0.25],
  "2-column-custom": [0.5, 0.5],
};

export function getCanvasSplitRatio(type: CanvasSplitTypes): number[] {
  return CanvasSplitRatio[type];
}

export const CanvasSplitOptions: CanvasSplitOptionType[] = [
  {
    label: "1 Column",
    value: "1-column",
    icon: <Column100 />,
  },
  {
    label: "2 Column 50-50",
    value: "2-column-50-50",
    icon: <Column50_50 />,
  },
  {
    label: "2 Column 25-75",
    value: "2-column-25-75",
    icon: <Column25_75 />,
  },
  {
    label: "2 Column 75-25",
    value: "2-column-75-25",
    icon: <Column75_25 />,
  },
  {
    label: "2 Column custom",
    value: "2-column-custom",
    icon: <Icon name="code" />,
  },
];

export const getCanvasSplittingConfig = () => {
  return {
    helpText: "Split a column into two.",
    propertyName: "canvasSplitType",
    label: "Column Split",
    controlType: "CANVAS_SPLIT_OPTIONS",
    defaultValue: CanvasSplitOptions[0].value,
    options: CanvasSplitOptions,
    isJSConvertible: false,
    isBindProperty: false,
    isTriggerProperty: true,
    validation: { type: ValidationTypes.TEXT },
  };
};
