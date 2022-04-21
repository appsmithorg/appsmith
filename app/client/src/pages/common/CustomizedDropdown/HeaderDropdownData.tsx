import { Directions } from "utils/helpers";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { getOnSelectAction, DropdownOnSelectActions } from "./dropdownHelpers";
import { CustomizedDropdownProps } from "./index";
import { User } from "constants/userConstants";

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
