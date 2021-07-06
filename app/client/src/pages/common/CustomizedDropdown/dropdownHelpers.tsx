import store from "store";
import { IconNames } from "@blueprintjs/icons";
import { Direction, Directions } from "utils/helpers";
import { PopoverPosition } from "@blueprintjs/core";
import history from "utils/history";
import log from "loglevel";

export const DropdownOnSelectActions: { [id: string]: string } = {
  REDIRECT: "redirect",
  DISPATCH: "dispatch",
};

type DropdownOnSelectActionType = typeof DropdownOnSelectActions[keyof typeof DropdownOnSelectActions];

// TODO(abhinav): Figure out how to enforce payload type.
export const getOnSelectAction = (
  type: DropdownOnSelectActionType,
  payload: any,
) => {
  switch (type) {
    case DropdownOnSelectActions.DISPATCH:
      store.dispatch(payload);
      break;
    case DropdownOnSelectActions.REDIRECT:
      if (history.location.pathname !== payload.path) {
        history.push(payload.path);
      }
      break;
    default:
      log.error("No such action registered", type);
  }
};

export const getDirectionBased: {
  [id: string]: (direction: Direction) => string;
} = {
  ICON_NAME: (direction: Direction) => {
    switch (direction) {
      case Directions.UP:
        return IconNames.CHEVRON_UP;
      case Directions.DOWN:
        return IconNames.CHEVRON_DOWN;
      case Directions.LEFT:
        return IconNames.CHEVRON_LEFT;
      case Directions.RIGHT:
        return IconNames.CHEVRON_RIGHT;
      default:
        return IconNames.CHEVRON_DOWN;
    }
  },
  POPPER_POSITION: (direction: Direction) => {
    switch (direction) {
      case Directions.UP:
        return PopoverPosition.TOP;
      case Directions.DOWN:
        return PopoverPosition.BOTTOM;
      case Directions.LEFT:
        return PopoverPosition.LEFT_BOTTOM;
      case Directions.RIGHT:
        return PopoverPosition.RIGHT_TOP;
      default:
        return PopoverPosition.BOTTOM_RIGHT;
    }
  },
};
