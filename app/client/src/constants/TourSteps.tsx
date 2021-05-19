import { TourType } from "entities/Tour";
import commentsTourSteps from "comments/tour/commentsTourSteps";

const TourStepsByType = {
  [TourType.COMMENTS_TOUR]: commentsTourSteps,
};

export default TourStepsByType;
