import React, { useState } from "react";
import Button, { Category, Size } from "components/ads/Button";

import styled from "styled-components";
import { createMessage, NEXT, BACK } from "constants/messages";
import { useTransition, animated } from "react-spring";

const Container = styled.div`
  box-shadow: 1px 0px 10px 5px rgba(0, 0, 0, 0.15);
`;

const Footer = styled.div`
  padding: ${(props) => props.theme.spaces[7]}px;
  justify-content: space-between;
  display: flex;
`;

const Dot = styled.div<{ active: boolean }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  margin-right: ${(props) => props.theme.spaces[1]}px;
  background-color: ${(props) =>
    props.active
      ? props.theme.colors.showcaseCarousel.activeStepDot
      : props.theme.colors.showcaseCarousel.inactiveStepDot};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
`;

const Buttons = styled.div`
  display: flex;
  & button:last-child {
    margin-left: ${(props) => props.theme.spaces[1]}px;
`;

type Step = {
  component: any;
  props: any;
};

export type Steps = Array<Step>;

type Props = {
  steps: Steps;
};

type DotsProps = {
  count: number;
  activeIndex: number;
};

function Dots(props: DotsProps) {
  return (
    <Row>
      {Array.from(new Array(props.count)).map((_a, index) => (
        <Dot active={index === props.activeIndex} key={index} />
      ))}
    </Row>
  );
}

export default function ShowcaseCarousel(props: Props) {
  const { steps } = props;
  const [activeIndex, setCurrentIdx] = useState(0);
  const currentStep = steps[activeIndex];
  const { component: ContentComponent, props: componentProps } = currentStep;
  const length = steps.length;

  const transition = useTransition("key", null, {
    from: { transform: "translateY(+2%)" },
    enter: { transform: "translateY(0%)" },
    leave: { transform: "translateY(0%)" },
    config: { duration: 300 },
  });

  return (
    <Container>
      {transition.map(
        ({ item, props: springProps }: { item: string; props: any }) => (
          <animated.div key={item} style={springProps}>
            <ContentComponent {...componentProps} />
          </animated.div>
        ),
      )}
      <Footer>
        <Dots activeIndex={activeIndex} count={length} />
        <Buttons>
          {!componentProps.hideBackBtn && (
            <Button
              category={Category.tertiary}
              onClick={() => setCurrentIdx(Math.max(0, activeIndex - 1))}
              size={Size.large}
              tag="button"
              text={createMessage(BACK)}
            />
          )}
          <Button
            disabled={componentProps.isSubmitDisabled}
            onClick={() => {
              setCurrentIdx(Math.min(length - 1, activeIndex + 1));
              if (typeof componentProps.onSubmit === "function") {
                componentProps.onSubmit();
              }
            }}
            size={Size.large}
            tag="button"
            text={componentProps.nextBtnText || createMessage(NEXT)}
          />
        </Buttons>
      </Footer>
    </Container>
  );
}
