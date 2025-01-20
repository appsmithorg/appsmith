import React from "react";
import { IDE_TYPE, type IDEType } from "ee/entities/IDE/constants";
import type { Action } from "entities/Action";
import { AppQueryContextMenuItems } from "pages/Editor/IDE/EditorPane/Query/ListItem/AppQueryContextMenuItems";
import EntityContextMenu from "pages/Editor/IDE/EditorPane/Query/ListItem/EntityContextMenu";

export const getQueryContextMenuByIdeType = (
  ideType: IDEType,
  action: Action,
) => {
  switch (ideType) {
    case IDE_TYPE.App: {
      return (
        <EntityContextMenu
          menuContent={<AppQueryContextMenuItems action={action} />}
        />
      );
    }
  }
};
