export * from "ce/entities/IDE/constants";
import {
  IDEBasePaths as CE_IDEBasePaths,
  IDE_TYPE as CE_IDE_TYPE,
} from "ce/entities/IDE/constants";
import { PACKAGE_EDITOR_PATH } from "@appsmith/constants/routes/packageRoutes";

export const IDE_TYPE = {
  ...CE_IDE_TYPE,
  Package: "Package",
} as const;

export type IDEType = keyof typeof IDE_TYPE;

export const IDEBasePaths: Readonly<Record<IDEType, string[]>> = {
  ...CE_IDEBasePaths,
  [IDE_TYPE.Package]: [PACKAGE_EDITOR_PATH],
};
