import React from "react";
import Badge from "./Badge";
import { Directions } from "utils/helpers";
import { getOnSelectAction, DropdownOnSelectActions } from "./dropdownHelpers";
import { CustomizedDropdownProps } from "./index";
import { User } from "constants/userConstants";
import _ from "lodash";

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
