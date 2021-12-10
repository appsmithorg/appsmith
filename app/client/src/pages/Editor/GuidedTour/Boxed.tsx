import React from "react";
import { ReactNode } from "react";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { useSelector } from "store";

type BoxedProps = {
  alternative?: JSX.Element;
  children: ReactNode;
};

// Boxed(or hidden).
function Boxed(props: BoxedProps): JSX.Element | null {
  const guidedTour = useSelector(inGuidedTour);
  if (guidedTour) {
    if (props.alternative) {
      return props.alternative;
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
