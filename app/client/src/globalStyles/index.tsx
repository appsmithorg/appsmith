import React from "react";
import { TooltipStyles } from "./tooltip";
import { PopoverStyles } from "./popover";
import { UppyStyles } from "./uppy";
import { PortalStyles } from "./portals";
import { DialogStyles } from "./dialogs";
import { CodemirrorHintStyles } from "./CodemirrorHintStyles";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";

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
