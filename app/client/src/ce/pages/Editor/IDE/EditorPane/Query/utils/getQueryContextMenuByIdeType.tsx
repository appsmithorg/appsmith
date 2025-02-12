import React from "react";
import { IDE_TYPE, type IDEType } from "ee/IDE/Interfaces/IDETypes";
import type { Action } from "entities/Action";
import { AppQueryContextMenuItems } from "pages/Editor/IDE/EditorPane/Query/EntityItem/AppQueryContextMenuItems";
import EntityContextMenu from "IDE/Components/EntityContextMenu";

export const getQueryContextMenuByIdeType = (
  ideType: IDEType,
  action: Action,
) => {
  switch (ideType) {
    case IDE_TYPE.App: {
      return (
        <EntityContextMenu>
          <AppQueryContextMenuItems action={action} />
        </EntityContextMenu>
      );
    }
  }
};
