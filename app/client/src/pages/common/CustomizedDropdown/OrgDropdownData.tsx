import React from "react";
import Badge from "./Badge";
import { Directions } from "utils/helpers";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getOnSelectAction, DropdownOnSelectActions } from "./dropdownHelpers";
import DropdownComponent, { CustomizedDropdownProps } from "./index";
import { Link } from "react-router-dom";
import { Org } from "constants/orgConstants";
import { User } from "constants/userConstants";

const switchdropdown = (orgs: Org[]): CustomizedDropdownProps => ({
  sections: [
    {
      isSticky: true,
      options: [
        {
          content: "Create Organization",
          onSelect: () => getOnSelectAction(DropdownOnSelectActions.FORM, {}),
        },
      ],
    },
    {
      options: orgs.map(org => ({
        content: org.name,
        onSelect: () =>
          getOnSelectAction(DropdownOnSelectActions.DISPATCH, {
            type: ReduxActionTypes.SWITCH_ORGANIZATION_INIT,
            payload: {
              organizationId: org.id,
            },
          }),
      })),
    },
  ],
  trigger: {
    text: "Switch Organization",
  },
  openDirection: Directions.RIGHT,
  openOnHover: false,
});

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
              subtext="2 Projects"
              imageURL="https://via.placeholder.com/32"
            />
          ),
          active: false,
        },
        {
          content: <Link to="/org/settings">Organization Settings</Link>,
        },
        {
          content: <Link to="/org/users">Members</Link>,
        },
        {
          content: <Link to="/org/biling">Usage & Billing</Link>,
        },
        {
          content: <Link to="/org/support">Support</Link>,
        },
        {
          content: <DropdownComponent {...switchdropdown(orgs)} />,
          shouldCloseDropdown: false,
        },
        {
          content: "Switch To Personal Workspace",
          onSelect: () =>
            getOnSelectAction(DropdownOnSelectActions.DISPATCH, {
              type: ReduxActionTypes.SWITCH_ORGANIZATION_INIT,
              payload: { organizationId: currentOrg.id },
            }),
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
          active: false,
        },
        {
          content: "Settings",
          onSelect: () =>
            getOnSelectAction(
              DropdownOnSelectActions.REDIRECT,
              "/org/settings",
            ),
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
