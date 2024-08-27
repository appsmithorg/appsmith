import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";
import type { WidgetCardProps } from "widgets/BaseWidget";

export const fetchWidgetCards = () => {
  return {
    type: ReduxActionTypes.FETCH_WIDGET_CARDS,
  };
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const errorFetchingWidgetCards = (error: any) => {
  return {
    type: ReduxActionErrorTypes.FETCH_WIDGET_CARDS_ERROR,
    error,
  };
};

export const successFetchingWidgetCards = (cards: {
  [id: string]: WidgetCardProps[];
}) => {
  return {
    type: ReduxActionTypes.FETCH_WIDGET_CARDS_SUCCESS,
    cards,
  };
};

export const forceOpenWidgetPanel = (flag: boolean) => ({
  type: ReduxActionTypes.SET_FORCE_WIDGET_PANEL_OPEN,
  payload: flag,
});

export default {
  fetchWidgetCards,
  errorFetchingWidgetCards,
  successFetchingWidgetCards,
};
