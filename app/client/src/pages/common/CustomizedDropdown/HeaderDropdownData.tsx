import type { User } from "constants/userConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { Directions } from "utils/helpers";

import { DropdownOnSelectActions, getOnSelectAction } from "./dropdownHelpers";
import type { CustomizedDropdownProps } from "./index";

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
