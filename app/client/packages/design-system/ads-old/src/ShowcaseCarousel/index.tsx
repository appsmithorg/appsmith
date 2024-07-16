import React, { useState, useCallback, useEffect } from "react";
import Button, { Category, Size } from "../Button";

import styled from "styled-components";
import { createMessage, NEXT, BACK, SKIP } from "../constants/messages";
import { useTransition, animated } from "react-spring";
import Icon from "../Icon";

const Container = styled.div`
  box-shadow: 1px 0px 10px 5px rgba(0, 0, 0, 0.15);
  border-radius: var(--ads-v2-border-radius);
`;

const Footer = styled.div`
  padding: var(--ads-spaces-7);
  justify-content: space-between;
  display: flex;
`;

const Dot = styled.div<{ active: boolean }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  margin-right: var(--ads-spaces-1);
  background-color: ${(props) =>
    props.active
      ? "var(--ads-showcase-carousel-dot-active-background-color)"
      : "var(--ads-showcase-carousel-dot-background-color)"};
  cursor: pointer;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
`;

const Buttons = styled.div`
  display: flex;
  & button {
    border-radius: var(--ads-v2-border-radius);
  }
  & button:last-child {
    margin-left: var(--ads-spaces-1);
`;

const CloseBtnContainer = styled.div`
  position: absolute;
  right: var(--ads-spaces-6);
  top: var(--ads-spaces-6);
`;

interface Step {
  component: any;
  props: any;
}

export type Steps = Array<Step>;

interface Props {
  steps: Steps;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  onClose: () => void;
  onStepChange: (current: number, next: number) => void;
}

interface DotsProps {
  count: number;
  activeIndex: number;
  setCurrentIdx: (index: number) => void;
}

function Dots(props: DotsProps) {
  return (
    <Row>
      {Array.from(new Array(props.count)).map((_a, index) => (
        <Dot
          active={index === props.activeIndex}
          key={index}
          onClick={() => props.setCurrentIdx(index)}
        />
      ))}
    </Row>
  );
}

export default function ShowcaseCarousel(props: Props) {
  const { onClose, onStepChange, setActiveIndex, steps } = props;
  const [activeIndex, setCurrentIdxInState] = useState(props.activeIndex || 0);

  const setCurrentIdx = (index: number) => {
    if (activeIndex !== index) onStepChange(activeIndex, index);
    setCurrentIdxInState(index);
    setActiveIndex(index);
  };

  const currentStep = steps[activeIndex];
  const { component: ContentComponent, props: componentProps } = currentStep;
  const length = steps.length;

  useEffect(() => {
    setCurrentIdx(props.activeIndex);
  }, [props.activeIndex]);

  const transition = useTransition("key", {
    from: { transform: "translateY(+2%)" },
    enter: { transform: "translateY(0%)" },
    leave: { transform: "translateY(0%)" },
    config: { duration: 300 },
  });

  const handleSubmit = useCallback(() => {
    if (!componentProps.isSubmitDisabled) {
      setCurrentIdx(Math.min(length - 1, activeIndex + 1));
      if (typeof componentProps.onSubmit === "function") {
        componentProps.onSubmit();
      }
    }
  }, [
    componentProps.isSubmitDisabled,
    componentProps.onSubmit,
    activeIndex,
    setCurrentIdx,
    length,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const isEnterKey = e.key === "Enter" || e.keyCode === 13;
      if (isEnterKey) {
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <Container onKeyDown={handleKeyDown} tabIndex={0}>
      {transition((styles, item) => (
        <animated.div key={item} style={styles}>
          <ContentComponent {...componentProps} />
        </animated.div>
      ))}
      <Footer>
        <Dots
          activeIndex={activeIndex}
          count={length}
          setCurrentIdx={setCurrentIdx}
        />
        <Buttons>
          {componentProps.showSkipBtn && (
            <Button
              category={Category.secondary}
              onClick={componentProps.onSkip}
              size={Size.large}
              tag="button"
              text={createMessage(SKIP)}
            />
          )}
          {!componentProps.hideBackBtn && (
            <Button
              category={Category.secondary}
              onClick={() => setCurrentIdx(Math.max(0, activeIndex - 1))}
              size={Size.large}
              tag="button"
              text={createMessage(BACK)}
            />
          )}
          <Button
            disabled={componentProps.isSubmitDisabled}
            onClick={handleSubmit}
            size={Size.large}
            tag="button"
            text={componentProps.nextBtnText || createMessage(NEXT)}
            type="submit"
          />
        </Buttons>
      </Footer>
      <CloseBtnContainer>
        <Icon name="close-modal" onClick={onClose} />
      </CloseBtnContainer>
    </Container>
  );
}
