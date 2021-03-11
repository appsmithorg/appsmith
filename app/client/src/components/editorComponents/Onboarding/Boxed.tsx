import { OnboardingStep } from "constants/OnboardingConstants";
import React from "react";
import { ReactNode } from "react";
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

  if (onboarding && currentStep < props.step && !props.show) {
    if (props.alternative) {
      // eslint-disable-next-line react/jsx-no-useless-fragment
      return <>{props.alternative}</>;
    }

    return null;
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{props.children}</>;
}

Boxed.defaultProps = {
  show: false,
};

export default Boxed;
