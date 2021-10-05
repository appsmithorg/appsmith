import { TourType } from "entities/Tour";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { getActiveTourIndex, getActiveTourType } from "selectors/tourSelectors";
import { proceedToNextTourStep } from "actions/tourActions";

export const useIsTourStepActive = (
  activeTourStepConfig: { [key in TourType]?: any },
) => {
  const activeTourType = useSelector(getActiveTourType);
  const expectedActiveStep =
    activeTourType &&
    activeTourStepConfig &&
    activeTourStepConfig[activeTourType];

  const isCurrentStepActive = useSelector(
    (state: AppState) => getActiveTourIndex(state) === expectedActiveStep,
  );

  return isCurrentStepActive;
};

const useProceedToNextTourStep = (
  activeTourStepConfig: { [key in TourType]?: any },
) => {
  const dispatch = useDispatch();

  const isActive = useIsTourStepActive(activeTourStepConfig);

  return () => isActive && dispatch(proceedToNextTourStep());
};

export default useProceedToNextTourStep;
