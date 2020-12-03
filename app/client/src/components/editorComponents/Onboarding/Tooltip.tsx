import React, { RefObject, useEffect, useRef, useState } from "react";
import { Position, Popover, Classes } from "@blueprintjs/core";
import { useSelector } from "store";
import { getTooltipConfig } from "sagas/OnboardingSagas";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { showTooltip } from "actions/onboardingActions";

enum TooltipClassNames {
  TITLE = "tooltip-title",
  DESCRIPTION = "tooltip-description",
  SKIP = "tooltip-skip",
  ACTION = "tooltip-action",
}

const Wrapper = styled.div`
  width: 280px;
  background-color: #457ae6;
  color: white;
  padding: 10px;

  .${TooltipClassNames.TITLE} {
    font-weight: 500;
  }
  .${TooltipClassNames.DESCRIPTION} {
    font-size: 12px;
    margin-top: 8px;
  }
  .${TooltipClassNames.SKIP} {
    font-size: 10px;
    opacity: 0.7;

    span {
      text-decoration: underline;
      cursor: pointer;
    }
  }
  .${TooltipClassNames.ACTION} {
    padding: 6px 10px;
    cursor: pointer;
    color: white;
    border: none;
    font-size: 12px;
    background-color: #2c59b4;
  }
`;

const Container = styled.div`
  div.${Classes.POPOVER_ARROW} {
    display: block;
  }
  .bp3-popover-arrow-fill {
    fill: #457ae6;
  }
`;

const OnboardingToolTip = (props: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const showingTooltip = useSelector(
    state => state.ui.onBoarding.showingTooltip,
  );
  const popoverRef: RefObject<Popover> = useRef(null);
  const tooltipConfig = useSelector(getTooltipConfig);

  useEffect(() => {
    if (props.step.includes(showingTooltip) && props.show) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
    if (popoverRef.current) {
      popoverRef.current.reposition();
    }
  }, [props.step, props.show, showingTooltip, popoverRef]);

  if (isOpen) {
    return (
      <Container>
        <Popover
          ref={popoverRef}
          isOpen={true}
          autoFocus={false}
          enforceFocus={false}
          boundary={"viewport"}
          usePortal={false}
          position={props.position || Position.BOTTOM}
        >
          {props.children}
          <ToolTipContent details={tooltipConfig} />
        </Popover>
      </Container>
    );
  }

  return props.children;
};

const ToolTipContent = (props: any) => {
  const dispatch = useDispatch();
  const { title, description } = props.details;

  const endOnboarding = () => {
    dispatch({
      type: "END_ONBOARDING",
    });
  };

  return (
    <Wrapper>
      <div className={TooltipClassNames.TITLE}>{title}</div>
      <div className={TooltipClassNames.DESCRIPTION}>{description}</div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span className={TooltipClassNames.SKIP}>
          Done? <span onClick={endOnboarding}>Click here to End</span>
        </span>

        <button
          onClick={() => dispatch(showTooltip(-1))}
          className={TooltipClassNames.ACTION}
        >
          Got it!
        </button>
      </div>
    </Wrapper>
  );
};

export default OnboardingToolTip;
