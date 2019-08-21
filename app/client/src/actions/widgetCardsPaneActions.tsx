import {
  ReduxAction,
  ActionTypes
} from "../constants/ActionConstants"
import { IWidgetCardProps } from '../widgets/BaseWidget'

export const fetchWidgetCards = () => {
  return {
    type: ActionTypes.FETCH_WIDGET_CARDS
  }
}

export const errorFetchingWidgetCards = (error: T) => {
  return {
    type: ActionTypes.ERROR_FETCHING_WIDGET_CARDS,
    error
  }
}

export const successFetchingWidgetCards = (cards: <string, IWidgetCardProps[]>) => {
  return {
    type: ActionTypes.SUCCESS_FETCHING_WIDGET_CARDS,
    cards
  }
}
