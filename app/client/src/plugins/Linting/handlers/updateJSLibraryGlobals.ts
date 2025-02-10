import type { LintRequest, updateJSLibraryProps } from "plugins/Linting/types";
import isEqual from "lodash/isEqual";
import { JSLibraries, JSLibraryAccessor } from "workers/common/JSLibrary";
import { resetJSLibraries } from "workers/common/JSLibrary/resetJSLibraries";

export function updateJSLibraryGlobals({
  data,
}: LintRequest<updateJSLibraryProps>) {
  const { add, libs } = data;

  if (add) {
    JSLibraries.push(...libs);
  } else if (add === false) {
    for (const lib of libs) {
      const idx = JSLibraries.findIndex((l) =>
        isEqual(l.accessor.sort(), lib.accessor.sort()),
      );

      if (idx === -1) {
        JSLibraryAccessor.regenerateSet();

        return;
      }

      JSLibraries.splice(idx, 1);
    }
  } else {
    resetJSLibraries();
    JSLibraries.push(...libs);
  }

  JSLibraryAccessor.regenerateSet();

  return true;
}
