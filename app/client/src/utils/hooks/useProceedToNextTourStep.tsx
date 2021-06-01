import { TourType } from "entities/Tour";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { getActiveTourIndex, getActiveTourType } from "selectors/tourSelectors";
import { proceedToNextTourStep } from "actions/tourActions";

const useProceedToNextTourStep = (tourType: TourType, tourIndex: number) => {
  const dispatch = useDispatch();

  const isCurrentStepActive = useSelector(
    (state: AppState) => getActiveTourIndex(state) === tourIndex,
  );
  const isCurrentTourActive = useSelector(
    (state: AppState) => getActiveTourType(state) === tourType,
  );

  const isActive = isCurrentStepActive && isCurrentTourActive;

  return () => isActive && dispatch(proceedToNextTourStep());
};

export default useProceedToNextTourStep;
