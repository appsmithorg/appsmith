import { TourType } from "entities/Tour";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { getActiveTourIndex, getActiveTourType } from "selectors/tourSelectors";
import { proceedToNextTourStep } from "actions/tourActions";

const useProceedToNextTourStep = (
  tourTypes: Array<TourType> | TourType,
  tourIndex: number,
) => {
  const dispatch = useDispatch();

  const isCurrentStepActive = useSelector(
    (state: AppState) => getActiveTourIndex(state) === tourIndex,
  );

  const activeTourType = useSelector(getActiveTourType);
  const isCurrentTourActive =
    typeof tourTypes === "string"
      ? activeTourType === tourTypes
      : tourTypes.indexOf(activeTourType as TourType) !== -1;

  const isActive = isCurrentStepActive && isCurrentTourActive;

  return () => isActive && dispatch(proceedToNextTourStep());
};

export default useProceedToNextTourStep;
