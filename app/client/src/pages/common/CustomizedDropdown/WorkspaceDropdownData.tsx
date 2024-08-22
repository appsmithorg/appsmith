import React from "react";

import type { User } from "constants/userConstants";
import _ from "lodash";
import { Directions } from "utils/helpers";

import Badge from "./Badge";
import { DropdownOnSelectActions, getOnSelectAction } from "./dropdownHelpers";
import type { CustomizedDropdownProps } from "./index";

export const options = (
  user: User,
  workspaceName: string,
  workspaceId: string,
): CustomizedDropdownProps => {
  return {
    sections: [
      {
        options: [
          {
            content: (
              <Badge
                imageURL="https://via.placeholder.com/32"
                text={workspaceName}
              />
            ),
            disabled: true,
            shouldCloseDropdown: false,
          },
          {
            content: "Workspace Settings",
            onSelect: () =>
              getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
                path: `/workspace/${workspaceId}/settings`,
              }),
          },
          {
            content: "Share",
            onSelect: () => _.noop("Share option selected"),
          },
          {
            content: "Members",
            onSelect: () =>
              getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
                path: `/workspace/${workspaceId}/settings`,
              }),
          },
        ],
      },
    ],
    trigger: {
      icon: "WORKSPACE_ICON",
      text: workspaceName,
      outline: false,
    },
    openDirection: Directions.DOWN,
  };
};

export default options;
