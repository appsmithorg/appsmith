import React, { useEffect, useState } from "react";
import { Position, Popover } from "@blueprintjs/core";
import { useSelector } from "store";
import { getCurrentStep } from "sagas/OnboardingSagas";
import { useDispatch } from "react-redux";
import styled from "styled-components";

const ToolTipContent = styled.div`
  width: 280px;
  display: flex;
  justify-content: space-between;

  span {
    cursor: pointer;
  }
`;

const OnboardingToolTip = (props: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentStep = useSelector(getCurrentStep);
  const dispatch = useDispatch();

  useEffect(() => {
    if (props.step.includes(currentStep) && props.show) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [props.step, props.show, currentStep]);

  if (isOpen) {
    return (
      <Popover
        isOpen={true}
        autoFocus={false}
        enforceFocus={false}
        boundary={"viewport"}
        position={props.position || Position.BOTTOM}
      >
        {props.children}
        <ToolTipContent>
          <span
            onClick={() => {
              dispatch({
                type: "END_ONBOARDING",
              });
            }}
          >
            Click here to end {currentStep}
          </span>
          {/* <Button
            text={"Got it"}
            onClick={() => {
              dispatch({
                type: "NEXT_ONBOARDING_STEP",
              });
            }}
          /> */}
        </ToolTipContent>
      </Popover>
    );
  }

  return props.children;
};

export default OnboardingToolTip;
