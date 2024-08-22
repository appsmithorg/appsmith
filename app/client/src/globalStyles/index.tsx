import React from "react";

import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";

import { CodemirrorHintStyles } from "./CodemirrorHintStyles";
import { DialogStyles } from "./dialogs";
import { PopoverStyles } from "./popover";
import { PortalStyles } from "./portals";
import { TooltipStyles } from "./tooltip";
import { UppyStyles } from "./uppy";

export default function GlobalStyles() {
  return (
    <>
      <TooltipStyles />
      <PopoverStyles />
      <PortalStyles />
      <UppyStyles />
      <CodemirrorHintStyles editorTheme={EditorTheme.LIGHT} />
      <DialogStyles />
    </>
  );
}
