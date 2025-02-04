import React from "react";
import { IDE_TYPE, type IDEType } from "ee/entities/IDE/constants";
import type { Action } from "entities/Action";
import { AppQueryContextMenuItems } from "pages/AppIDE/EditorPane/Query/EntityItem/AppQueryContextMenuItems";
import EntityContextMenu from "pages/AppIDE/EditorPane/components/EntityContextMenu";

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
