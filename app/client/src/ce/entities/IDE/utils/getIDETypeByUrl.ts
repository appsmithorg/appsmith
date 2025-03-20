import { IDEBasePaths } from "ee/IDE/constants/routes";
import { IDE_TYPE, type IDEType } from "ee/IDE/Interfaces/IDETypes";
import { matchPath } from "react-router-dom";

export function getIDETypeByUrl(path: string): IDEType {
  for (const type in IDEBasePaths) {
    const basePaths = IDEBasePaths[type as IDEType];

    if (matchPath(path, { path: basePaths })) {
      return type as IDEType;
    }
  }

  return IDE_TYPE.None;
}
