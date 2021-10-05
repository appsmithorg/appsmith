import { OnboardingStep } from "constants/OnboardingConstants";
import React, { ReactNode } from "react";
import { useSelector } from "react-redux";
import { getCurrentStep, inOnboarding } from "sagas/OnboardingSagas";

type BoxedProps = {
  // child nodes are not visible until this step is reached
  step: OnboardingStep;
  // Any additional conditions to hide the children
  show?: boolean;
  alternative?: ReactNode;
  children: ReactNode;
};

// Boxed(or hidden).
function Boxed(props: BoxedProps) {
  const currentStep = useSelector(getCurrentStep);
  const onboarding = useSelector(inOnboarding);
  /*eslint-disable react/jsx-no-useless-fragment*/
  if (onboarding && currentStep < props.step && !props.show) {
    if (props.alternative) {
      return <>{props.alternative}</>;
    }

    return null;
  }

  return <>{props.children}</>;
  /*eslint-enable react/jsx-no-useless-fragment */
}

Boxed.defaultProps = {
  show: false,
};

export default Boxed;
