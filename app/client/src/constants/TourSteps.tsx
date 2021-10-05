import { TourType } from "entities/Tour";
import {
  commentsTourStepsEditMode,
  commentsTourStepsPublishedMode,
} from "comments/tour/commentsTourSteps";

const TourStepsByType = {
  [TourType.COMMENTS_TOUR_EDIT_MODE]: commentsTourStepsEditMode,
  [TourType.COMMENTS_TOUR_PUBLISHED_MODE]: commentsTourStepsPublishedMode,
};

export default TourStepsByType;
