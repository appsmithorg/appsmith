import React from "react";
import Badge from "./Badge";
import { Directions } from "utils/helpers";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getOnSelectAction, DropdownOnSelectActions } from "./dropdownHelpers";
import { CustomizedDropdownProps } from "./index";

import { Org } from "constants/orgConstants";
import { User } from "constants/userConstants";
import history from "utils/history";

// const switchdropdown = (orgs: Org[]): CustomizedDropdownProps => ({
//   sections: [
//     {
//       isSticky: true,
//       options: [
//         {
//           content: "Create Organization",
//           onSelect: () => getOnSelectAction(DropdownOnSelectActions.FORM, {}),
//         },
//       ],
//     },
//     {
//       options: orgs.map(org => ({
//         content: org.name,
//         onSelect: () =>
//           getOnSelectAction(DropdownOnSelectActions.DISPATCH, {
//             type: ReduxActionTypes.SWITCH_ORGANIZATION_INIT,
//             payload: {
//               organizationId: org.id,
//             },
//           }),
//       })),
//     },
//   ],
//   trigger: {
//     text: "Switch Organization",
//   },
//   openDirection: Directions.RIGHT,
//   openOnHover: false,
// });

export const options = (
  orgs: Org[],
  currentOrg: Org,
  user: User,
): CustomizedDropdownProps => ({
  sections: [
    {
      options: [
        {
          content: (
            <Badge
              text={currentOrg.name}
              imageURL="https://via.placeholder.com/32"
            />
          ),
          disabled: true,
          shouldCloseDropdown: false,
        },
        {
          content: "Organization Settings",
          onSelect: () =>
            getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
              path: "/org/settings",
            }),
          active: history.location.pathname === "/org/settings",
        },
        {
          content: "Applications",
          onSelect: () =>
            getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
              path: "/applications",
            }),
          active: history.location.pathname === "/applications",
        },
        {
          content: "Members",
          onSelect: () =>
            getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
              path: "/org/users",
            }),
          active: history.location.pathname === "/org/users",
        },
      ],
    },
    {
      options: [
        {
          content: (
            <Badge
              text={user.email}
              subtext={user.email}
              imageURL="https://via.placeholder.com/32"
            />
          ),
          disabled: true,
          shouldCloseDropdown: false,
        },
        {
          content: "Sign Out",
          onSelect: () =>
            getOnSelectAction(DropdownOnSelectActions.DISPATCH, {
              type: ReduxActionTypes.LOGOUT_USER_INIT,
            }),
        },
      ],
    },
  ],
  trigger: {
    icon: "ORG_ICON",
    text: currentOrg.name,
    outline: false,
  },
  openDirection: Directions.DOWN,
});

export default options;
