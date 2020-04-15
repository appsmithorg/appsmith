import { getPropertyControlTypes } from "components/propertyControls";
const ControlTypes = getPropertyControlTypes();
export type ControlType = typeof ControlTypes[keyof typeof ControlTypes];
