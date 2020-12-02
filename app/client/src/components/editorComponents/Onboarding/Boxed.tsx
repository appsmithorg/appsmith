import React, { ReactNode } from "react";
import { useSelector } from "react-redux";
import { getCurrentStep, inOnboarding } from "sagas/OnboardingSagas";

type BoxedProps = {
  // child nodes are not visible until this step is reached
  step: number;
  children: ReactNode;
};

// Boxed(or hidden).
const Boxed: React.FC<BoxedProps> = (props: BoxedProps) => {
  const currentStep = useSelector(getCurrentStep);
  const onboarding = useSelector(inOnboarding);

  if (onboarding && currentStep < props.step) {
    return null;
  }

  return <>{props.children}</>;
};

export default Boxed;
