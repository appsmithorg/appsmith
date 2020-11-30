import React, { RefObject, useEffect, useRef, useState } from "react";
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
  const popoverRef: RefObject<Popover> = useRef(null);

  useEffect(() => {
    if (props.step.includes(currentStep) && props.show) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
    if (popoverRef.current) {
      popoverRef.current.reposition();
    }
  }, [props.step, props.show, currentStep, popoverRef]);

  if (isOpen) {
    return (
      <Popover
        ref={popoverRef}
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
