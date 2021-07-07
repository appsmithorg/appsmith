import React from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { commentModeSelector } from "selectors/commentsSelectors";

const StyledPreventInteractionsOverlay = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
`;

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: relative;

  > div {
    height: 100%;
  }
`;

type Props = {
  children: React.ReactNode;
  widgetType: string;
};

const preventInteractionsBlacklist = [
  "CONTAINER_WIDGET",
  "CANVAS_WIDGET",
  "TABS_WIDGET",
  "FORM_WIDGET",
];

/**
 * Prevent interactions with the component
 */
function PreventInteractionsOverlay({ children, widgetType }: Props) {
  const isCommentMode = useSelector(commentModeSelector);
  const isComponentBlacklisted =
    preventInteractionsBlacklist.indexOf(widgetType) !== -1;
  const shouldPreventInteraction = !isComponentBlacklisted && isCommentMode;

  return (
    <Container>
      {children}
      {shouldPreventInteraction && <StyledPreventInteractionsOverlay />}
    </Container>
  );
}

export default PreventInteractionsOverlay;
