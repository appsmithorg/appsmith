import React, { useEffect, useState } from "react";
import { Position, Tooltip, Button } from "@blueprintjs/core";
import { useSelector } from "store";
import { getCurrentStep } from "sagas/OnboardingSagas";
import { useDispatch } from "react-redux";
import styled from "styled-components";

const ToolTipContent = styled.div`
  width: 280px;
  display: flex;
  justify-content: space-between;
`;

const OnboardingToolTip = (props: any) => {
  const [isOpen, setIsOpen] = useState(props.isOpen);
  const currentStep = useSelector(getCurrentStep);
  const dispatch = useDispatch();

  useEffect(() => {
    if (currentStep === props.step && props.show) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [props.step, props.show, currentStep]);

  if (isOpen) {
    return (
      <Tooltip
        isOpen={isOpen}
        autoFocus={false}
        enforceFocus={false}
        boundary={"viewport"}
        position={props.position || Position.BOTTOM}
      >
        {props.children}
        <ToolTipContent>
          <span>Click here to end</span>
          <Button
            text={"Got it"}
            onClick={() => {
              dispatch({
                type: "NEXT_ONBOARDING_STEP",
              });
            }}
          />
        </ToolTipContent>
      </Tooltip>
    );
  }

  return props.children;
};

export default OnboardingToolTip;
