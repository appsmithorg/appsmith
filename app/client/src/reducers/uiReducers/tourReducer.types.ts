import type { TourType } from "../../entities/Tour";

export interface TourReducerState {
  isTourInProgress: boolean;
  activeTourType?: TourType;
  activeTourIndex: number;
}
