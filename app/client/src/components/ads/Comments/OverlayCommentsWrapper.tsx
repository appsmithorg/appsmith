import React, { useRef } from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import Comments from "./Comments";
import { isCommentMode as isCommentModeSelector } from "components/ads/Comments/selectors";
import { createUnpublishedCommentThreadRequest } from "actions/commentActions";

type Props = {
  children: React.ReactNode;
  refId: string;
  widgetType: string;
};

const getOffsetPos = (clickEvent: any, containerRef: any) => {
  const boundingClientRect = containerRef.getBoundingClientRect();
  const containerPosition = {
    left: boundingClientRect.left,
    top: boundingClientRect.top,
  };
  const clickPosition = {
    left: clickEvent.clientX,
    top: clickEvent.clientY,
  };

  const offsetLeft = clickPosition.left - containerPosition.left;
  const offsetTop = clickPosition.top - containerPosition.top;

  const offsetLeftPercent = parseInt(
    `${(offsetLeft / boundingClientRect.width) * 100}`,
  );
  const offsetTopPercent = parseInt(
    `${(offsetTop / boundingClientRect.height) * 100}`,
  );

  return {
    left: offsetLeftPercent,
    top: offsetTopPercent,
  };
};

const PreventClicksOverlay = styled.div`
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
  cursor: -webkit-image-set(
        url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAoCAYAAACFFRgXAAAAAXNSR0IArs4c6QAAA1JJREFUWAntmD9rFFEUxfPPP40KkSSgnb1owCLWFinzEUSwFhLQD2GRgLUSUvgJrC3FRRQUCxtLd8OuKLqVGjWe37gnufNmNpnMxl2LvXC47925794zZ+6E7ExOlNt5hW8Jl4XZ8pR/Fv2sym+FTeFT2mUyDWgP2QfC2ZJrwwx11eyOUCCdkrirwJOlpaXH7Xa7uTtkU88P9IaDAJecpQqz3xJmO53O4tzc3IVc9pA26t1cWFh4rXaMx01h162nvJCHLHtmdnJUZNV7Yn5+/iIcBLjAiXVmZYRN3Dmj8iZqn/GYCWxMlIR4IyFlqEtzwP92ZwctOXvW3jtvFN48chy9gZATvB4FydjTokVe/8WjjyQPXUeFSfZdHXpwiAk5TinhIfKo12pMuJ5u1U+NFa6uVb3MscL1dKt+aqxwda3qZY4Vrqdb9VNjhatrVS+zTOEvlGq1Wp16JQc/pd7tXpWMS6xYRvgdCSsrK41ms/kxJg9jrZ4d9X7R65VxiX39vyZ+Wjgp8Iv1vnBO4Iaco2XRVldXd9bX128UrxQja2trTzc2Nk4Ur+Qi/KTnN9xX4Z7QFH4Iv4RdSGKQghzYEV4JfAE6I5wS+pJuNBrT3W73/fLy8iXl9bUjkIXoG4GvT4wGfLiB7NuEiZgwd386AMW5KW4kms9dU5APHVMHKR3I0nhLeClgex9I/m4zYiiJot8C9khbYfIhkcKPhyIpaM7j4uW8IqVnypQOZDm/KTCfPwNc1zHIAUjjie8pHAkrnnv0kSyHXMhFaEShlgDpqynphOwj5TQEiBhpTfbxGn3dR8s8QavLTRiea65FY881PsQwRuC6cFuYZjzkJ3ovGA0fCs8FE8ypprjNIiEE5wziIKeo9yZj7zje5mvcGGR5MYFJe+ZpbLLftQaQtmoZCe1t3nsE7B3PlHSyPRcNH8CXwXkuuK08xmOxVyMlG+fS6qV1iVPPvbXct/htbT+6TzjGvEZdDO+iJox/JtAUizOLuowCIC+e0baauXm17GJWOhr8GWRE/DJD3C/SQaNQrNwn0k/hPumFMCqhso09JOMMW1XifiLOP7IfVGE3tNL+qxIJQ9LwGPjckf1xEaYxtSKIQTCC2EB2nIRNJK05sKoujP8D2feZlPig5nQAAAAASUVORK5CYII=")
          2x
      )
      11 17,
    auto;
`;

const preventInteractionsBlacklist = [
  "CONTAINER_WIDGET",
  "CANVAS_WIDGET",
  "TABS_WIDGET",
  "FORM_WIDGET",
];

const OverlayCommentsWrapper = ({ children, refId, widgetType }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isCommentMode = useSelector(isCommentModeSelector);
  const dispatch = useDispatch();
  const clickHandler = (e: any) => {
    e.persist();
    if (containerRef.current) {
      const position = getOffsetPos(e, containerRef.current);
      if (!isCommentMode) return;
      dispatch(
        createUnpublishedCommentThreadRequest({
          refId,
          position,
        }),
      );
    }
  };

  if (!isCommentMode) return <>{children}</>;

  const shouldNotPreventComponentInteraction =
    preventInteractionsBlacklist.indexOf(widgetType) !== -1;

  return (
    <Container
      ref={containerRef}
      onClick={clickHandler}
      data-cy="overlay-comments-wrapper"
    >
      {children}
      {/* Prevent clicks to the component in the comment mode */}
      {!shouldNotPreventComponentInteraction && <PreventClicksOverlay />}
      <Comments refId={refId} />
    </Container>
  );
};

export default OverlayCommentsWrapper;
