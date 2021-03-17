import React from "react";
import Badge from "./Badge";
import { Directions } from "utils/helpers";
import { getOnSelectAction, DropdownOnSelectActions } from "./dropdownHelpers";
import { CustomizedDropdownProps } from "./index";
import { User } from "constants/userConstants";
import _ from "lodash";

export const options = (
  user: User,
  orgName: string,
  orgId: string,
): CustomizedDropdownProps => {
  return {
    sections: [
      {
        options: [
          {
            content: (
              <Badge text={orgName} imageURL="https://via.placeholder.com/32" />
            ),
            disabled: true,
            shouldCloseDropdown: false,
          },
          {
            content: "Organization Settings",
            onSelect: () =>
              getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
                path: `/org/${orgId}/settings`,
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
                path: `/org/${orgId}/settings`,
              }),
          },
        ],
      },
    ],
    trigger: {
      icon: "ORG_ICON",
      text: orgName,
      outline: false,
    },
    openDirection: Directions.DOWN,
  };
};

export default options;
