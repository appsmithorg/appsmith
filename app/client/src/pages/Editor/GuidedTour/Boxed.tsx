import React from "react";
import { ReactNode } from "react";
import {
  forceShowContentSelector,
  getCurrentStep,
  inGuidedTour,
} from "selectors/onboardingSelectors";
import { useSelector } from "store";

type BoxedProps = {
  alternative?: JSX.Element;
  children: ReactNode;
  step: number;
  // under which condition do you want to show an alternative or nothing(meaning hide)
  show: boolean;
};

// Boxed(or hidden).
function Boxed(props: BoxedProps): JSX.Element | null {
  const guidedTour = useSelector(inGuidedTour);
  const currentStep = useSelector(getCurrentStep);
  const forceShowContent = useSelector(forceShowContentSelector);

  const hide =
    guidedTour &&
    props.show &&
    forceShowContent < props.step &&
    currentStep <= props.step;
  if (hide) {
    if (props.alternative) {
      return props.alternative;
    }

    return null;
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{props.children}</>;
}

Boxed.defaultProps = {
  show: true,
  // Some out of bound value as by default the children
  // of this component is to be hidden
  step: 99,
};

export default Boxed;
