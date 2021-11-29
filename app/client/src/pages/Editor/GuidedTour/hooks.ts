import { toggleShowDeviationDialog } from "actions/onboardingActions";
import { useDispatch, useSelector } from "react-redux";
import { inGuidedTour } from "selectors/onboardingSelectors";

export const useBlockAction = () => {
  const dispatch = useDispatch();
  const guidedTour = useSelector(inGuidedTour);
  const callback = () => {
    if (guidedTour) {
      dispatch(toggleShowDeviationDialog(true));
    }
  };

  return callback;
};
