import React from "react";
import { IDE_TYPE, type IDEType } from "ee/IDE/Interfaces/IDETypes";
import EntityContextMenu from "pages/Editor/IDE/EditorPane/components/EntityContextMenu";
import { AppJSContextMenuItems } from "pages/Editor/IDE/EditorPane/JS/EntityItem/AppJSContextMenuItems";
import type { JSCollection } from "entities/JSCollection";

export const getJSContextMenuByIdeType = (
  ideType: IDEType,
  jsAction: JSCollection,
) => {
  switch (ideType) {
    case IDE_TYPE.App: {
      return (
        <EntityContextMenu>
          <AppJSContextMenuItems jsAction={jsAction} />
        </EntityContextMenu>
      );
    }
  }
};
