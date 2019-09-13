import { ReduxActionTypes } from "../constants/ReduxActionConstants";
import { WidgetCardProps } from "../widgets/BaseWidget";

export const fetchWidgetCards = () => {
  return {
    type: ReduxActionTypes.FETCH_WIDGET_CARDS,
  };
};

export const errorFetchingWidgetCards = (error: any) => {
  return {
    type: ReduxActionTypes.ERROR_FETCHING_WIDGET_CARDS,
    error,
  };
};

export const successFetchingWidgetCards = (cards: {
  [id: string]: WidgetCardProps[];
}) => {
  return {
    type: ReduxActionTypes.SUCCESS_FETCHING_WIDGET_CARDS,
    cards,
  };
};

export default {
  fetchWidgetCards,
  errorFetchingWidgetCards,
  successFetchingWidgetCards,
};
