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
  user: User,
  dropdownMainMenuName: string,
): CustomizedDropdownProps => ({
  sections: [
    {
      options: [
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
    text: dropdownMainMenuName,
    outline: false,
  },
  openDirection: Directions.DOWN,
});

export default options;
