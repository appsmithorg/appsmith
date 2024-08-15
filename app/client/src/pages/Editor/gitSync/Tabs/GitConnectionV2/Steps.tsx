import { Button, Divider, Text } from "@appsmith/ads";
import noop from "lodash/noop";
import React, { Fragment } from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  margin-bottom: 16px;
  align-items: center;
`;

const StepButton = styled(Button)`
  display: flex;
  align-items: center;

  .ads-v2-button__content {
    padding: 4px;
  }

  .ads-v2-button__content-children {
    font-weight: var(--ads-v2-font-weight-bold);
  }

  .ads-v2-button__content-children > * {
    font-weight: var(--ads-v2-font-weight-bold);
  }
`;

interface StepNumberProps {
  active: boolean;
}

const StepNumber = styled.div<StepNumberProps>`
  width: 20px;
  height: 20px;
  border-radius: 10px;
  border-style: solid;
  border-width: 1px;
  border-color: ${(p) =>
    p.active
      ? "var(--ads-v2-color-border-success)"
      : "var(--ads-v2-color-border-emphasis)"};
  background-color: ${(p) =>
    p.active
      ? "var(--ads-v2-color-bg-success)"
      : "var(--ads-v2-color-bg-subtle)"};
  color: ${(p) =>
    p.active
      ? "var(--ads-v2-color-border-success)"
      : "var(--ads-v2-color-text)"};
  display: flex;
  justify-content: center;
  align-items: center;
  line-height: 1;
  margin-right: 4px;
  flex-shrink: 0;
`;

const StepText = styled(Text)`
  font-weight: 500;
`;

const StepLine = styled(Divider)`
  width: initial;
  margin-left: 8px;
  margin-right: 8px;
  flex: 1;
`;

interface StepsProps {
  steps: {
    key: string;
    text: string;
  }[];
  activeKey: string;
  onActiveKeyChange: (activeKey: string) => void;
}

function Steps({
  activeKey,
  onActiveKeyChange = noop,
  steps = [],
}: StepsProps) {
  const activeIndex = steps.findIndex((s) => s.key === activeKey);

  return (
    <Container>
      {steps.map((step, index) => {
        return (
          <Fragment key={step.key}>
            {index > 0 && <StepLine />}
            <StepButton
              isDisabled={index > activeIndex}
              kind="tertiary"
              onClick={() => {
                if (index < activeIndex) {
                  onActiveKeyChange(step.key);
                }
              }}
              role="button"
              size="md"
              style={{ opacity: index > activeIndex ? 0.6 : 1 }}
            >
              <StepNumber active={step.key === activeKey}>
                {index + 1}
              </StepNumber>
              <StepText>{step.text}</StepText>
            </StepButton>
          </Fragment>
        );
      })}
    </Container>
  );
}

export default Steps;
