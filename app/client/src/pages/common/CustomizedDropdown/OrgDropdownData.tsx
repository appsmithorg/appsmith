import React from "react";
import Badge from "./Badge";
import { Directions } from "utils/helpers";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { getOnSelectAction, DropdownOnSelectActions } from "./dropdownHelpers";
import DropdownComponent, { CustomizedDropdownProps } from "./index";
import { Org } from "constants/orgConstants";
import { User } from "constants/userConstants";
import FormDialogComponent from "components/editorComponents/form/FormDialogComponent";
import CreateOrganizationForm from "pages/organization/CreateOrganizationForm";

const switchdropdown = (
  orgs: Org[],
  currentOrg: Org,
): CustomizedDropdownProps => ({
  sections: [
    {
      isSticky: true,
      options: [
        {
          content: (
            <FormDialogComponent
              trigger="Create Organization"
              Form={CreateOrganizationForm}
              title="Create Organization"
            />
          ),
          shouldCloseDropdown: false,
        },
      ],
    },
    {
      options: orgs
        .filter(org => org.id !== currentOrg.id)
        .map(org => ({
          content: org.name,
          onSelect: () =>
            getOnSelectAction(DropdownOnSelectActions.DISPATCH, {
              type: ReduxActionTypes.SWITCH_ORGANIZATION_INIT,
              payload: {
                orgId: org.id,
              },
            }),
        })),
    },
  ],
  trigger: {
    text: "Switch Organization",
  },
  openDirection: Directions.RIGHT,
  openOnHover: true,
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
        },
        {
          content: "Applications",
          onSelect: () =>
            getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
              path: "/applications",
            }),
        },
        {
          content: "Members",
          onSelect: () =>
            getOnSelectAction(DropdownOnSelectActions.REDIRECT, {
              path: "/users",
            }),
        },
        {
          content: <DropdownComponent {...switchdropdown(orgs, currentOrg)} />,
          shouldCloseDropdown: false,
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
