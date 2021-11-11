import { ControllerRenderProps } from "react-hook-form";
import { SchemaItem } from "../constants";

export type BaseFieldComponentProps<TProps = any> = {
  hideLabel?: boolean;
  name: ControllerRenderProps["name"];
  propertyPath: string;
  schemaItem: SchemaItem & TProps;
};
