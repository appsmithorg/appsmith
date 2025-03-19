import { IDEBasePaths } from "ee/IDE/constants/routes";
import type { IDEType } from "ee/IDE/Interfaces/IDETypes";

export function getBaseUrlsForIDEType(type: IDEType): string[] {
  return IDEBasePaths[type];
}
