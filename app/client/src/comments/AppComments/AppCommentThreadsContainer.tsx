import React, { useEffect } from "react";
import styled from "styled-components";
import useWindowDimensions from "utils/hooks/useWindowDimensions";
import { useSpring, animated } from "react-spring";

import AppCommentThreads from "./AppCommentThreads";

type Props = {
  isOpen: boolean;
};

const AnimatedDiv = animated.div;
const Container = styled(AnimatedDiv)`
  overflow: auto;
`;

function AppCommentThreadsContainer({ isOpen }: Props) {
  const [, windowHeight] = useWindowDimensions();
  const [springHeight, setHeight] = useSpring(() => ({
    height: 0,
  }));

  useEffect(() => {
    if (isOpen) setHeight({ height: windowHeight * 0.75 });
  }, [windowHeight]);

  useEffect(() => {
    setHeight({ height: isOpen ? windowHeight * 0.75 : 0 });
  }, [isOpen]);

  return (
    <Container style={{ height: springHeight.height }}>
      <AppCommentThreads />
    </Container>
  );
}

export default AppCommentThreadsContainer;
