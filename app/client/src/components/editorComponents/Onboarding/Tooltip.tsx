import React, {
  MutableRefObject,
  ReactNode,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { Classes, Icon, Popover, Position } from "@blueprintjs/core";
import { useSelector } from "store";
import { getTooltipConfig } from "sagas/OnboardingSagas";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import useClipboard from "utils/hooks/useClipboard";
import { endOnboarding, showTooltip } from "actions/onboardingActions";
import { Colors } from "constants/Colors";
import {
  OnboardingStep,
  OnboardingTooltip,
  OnboardingConfig,
} from "constants/OnboardingConstants";
import { BaseModifier } from "popper.js";
import AnalyticsUtil from "utils/AnalyticsUtil";

enum TooltipClassNames {
  TITLE = "tooltip-title",
  DESCRIPTION = "tooltip-description",
  SKIP = "tooltip-skip",
  ACTION = "tooltip-action",
  SNIPPET = "tooltip-snippet",
}

const Wrapper = styled.div<{ isFinalStep: boolean }>`
  width: 280px;
  background-color: ${(props) => (props.isFinalStep ? "#F86A2B" : "#457ae6")};
  color: white;
  padding: 10px;

  .${TooltipClassNames.TITLE} {
    font-weight: 500;
    font-size: 17px;
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
  .${TooltipClassNames.SNIPPET} {
    background-color: #2c59b4;
    color: white;
    font-size: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 8px 0px;
    position: relative;
    cursor: pointer;

    & > span {
      padding: 6px;
    }

    & div.clipboard-message {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      z-index: 1;
      &.success {
        background: #2c59b4;
      }
      &.error {
        background: ${Colors.RED};
      }
    }
    .${Classes.ICON} {
      opacity: 0.7;
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

const Container = styled.div<{ isFinalStep: boolean }>`
  div.${Classes.POPOVER_ARROW} {
    display: block;
  }
  .bp3-popover-arrow-fill {
    fill: ${(props) => (props.isFinalStep ? "#F86A2B" : "#457ae6")};
  }
`;

const ActionWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
`;

type OnboardingToolTipProps = {
  step: OnboardingStep[];
  children: ReactNode;
  show?: boolean;
  position?: Position;
  dismissOnOutsideClick?: boolean;
  offset?: BaseModifier & {
    offset?: number | string;
  };
};

const OnboardingToolTip: React.FC<OnboardingToolTipProps> = (
  props: OnboardingToolTipProps,
) => {
  const [isOpen, setIsOpen] = useState(false);
  const showingTooltip = useSelector(
    (state) => state.ui.onBoarding.showingTooltip,
  );
  const popoverRef: RefObject<Popover> = useRef(null);
  const tooltipConfig = useSelector(getTooltipConfig);
  const { isFinalStep = false } = tooltipConfig;
  const dispatch = useDispatch();

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
      <Container className="t--onboarding-tooltip" isFinalStep={isFinalStep}>
        <Popover
          ref={popoverRef}
          isOpen={true}
          autoFocus={false}
          enforceFocus={false}
          boundary={"viewport"}
          usePortal={false}
          position={props.position || Position.TOP}
          modifiers={{
            preventOverflow: {
              enabled: true,
              boundariesElement: "viewport",
            },
            hide: { enabled: false },
            offset: props.offset,
          }}
          onInteraction={(nextOpenState: boolean) => {
            if (!nextOpenState && props.dismissOnOutsideClick) {
              dispatch(showTooltip(OnboardingStep.NONE));
            }

            if (!nextOpenState && tooltipConfig.onClickOutside) {
              dispatch(tooltipConfig.onClickOutside);
            }
          }}
        >
          {props.children}
          <ToolTipContent details={tooltipConfig} />
        </Popover>
      </Container>
    );
  }

  return <>{props.children}</>;
};

OnboardingToolTip.defaultProps = {
  show: true,
  dismissOnOutsideClick: true,
};

type ToolTipContentProps = {
  details: OnboardingTooltip;
};

const ToolTipContent = (props: ToolTipContentProps) => {
  const showingTooltip = useSelector(
    (state) => state.ui.onBoarding.showingTooltip,
  );

  const dispatch = useDispatch();
  const {
    title,
    description,
    snippet,
    action,
    isFinalStep = false,
  } = props.details;
  const snippetRef: MutableRefObject<HTMLDivElement | null> = useRef(null);
  const write = useClipboard(snippetRef);

  const copyBindingToClipboard = () => {
    snippet && write(snippet);
  };

  const skipOnboarding = () => {
    const onboardingStep = OnboardingConfig[showingTooltip].name;

    // Logging at which step was the skip onboarding clicked
    AnalyticsUtil.logEvent("SKIP_ONBOARDING", { step: onboardingStep });
    dispatch(endOnboarding());
  };

  return (
    <Wrapper isFinalStep={isFinalStep}>
      <div className={TooltipClassNames.TITLE}>{title}</div>
      <div className={TooltipClassNames.DESCRIPTION}>{description}</div>

      {snippet && (
        <div
          className={TooltipClassNames.SNIPPET}
          onClick={copyBindingToClipboard}
          ref={snippetRef}
        >
          <span>{snippet}</span>
          <Icon icon="duplicate" iconSize={14} color={Colors.WHITE} />
        </div>
      )}
      <ActionWrapper>
        <span className={TooltipClassNames.SKIP}>
          Done? <span onClick={skipOnboarding}>Click here to End</span>
        </span>

        {action && (
          <button
            onClick={() => {
              if (action.action) {
                dispatch(action.action);
                dispatch(showTooltip(action.action.payload));

                return;
              }
              dispatch(showTooltip(OnboardingStep.NONE));
            }}
            className={TooltipClassNames.ACTION}
          >
            {action.label}
          </button>
        )}
      </ActionWrapper>
    </Wrapper>
  );
};

export default OnboardingToolTip;
