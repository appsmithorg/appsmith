import React, { useState, useRef, useEffect, useCallback } from "react";
import styled, { withTheme } from "styled-components";
import moment from "moment";
import "@github/g-emoji-element";
import Icon, { IconSize } from "components/ads/Icon";
import { Colors } from "constants/Colors";
import { Text, Case, TextType } from "design-system";
import { Classes } from "components/ads/common";

const StyledContainer = styled.div`
  color: ${(props) => props.theme.colors.text.normal};
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
`;

export const StyledSeparator = styled.div`
  width: 100%;
  background-color: ${(props) => props.theme.colors.modal.separator};
  opacity: 0.6;
  height: 1px;
`;

const StyledDate = styled.div`
  font-weight: ${(props) => props.theme.typography.releaseList.fontWeight};
  font-size: ${(props) => props.theme.typography.releaseList.fontSize}px;
  line-height: ${(props) => props.theme.typography.releaseList.lineHeight}px;
  letter-spacing: ${(props) =>
    props.theme.typography.releaseList.letterSpacing}px;
  color: ${(props) => props.theme.colors.text.normal};
  margin-top: ${(props) => props.theme.spaces[3]}px;
`;

const StyledContent = styled.div<{ maxHeight: number }>`
  li,
  p {
    font-weight: ${(props) => props.theme.typography.releaseList.fontWeight};
    font-size: ${(props) => props.theme.typography.releaseList.fontSize}px;
    line-height: ${(props) => props.theme.typography.releaseList.lineHeight}px;
    letter-spacing: ${(props) =>
      props.theme.typography.releaseList.letterSpacing}px;
    color: ${(props) => props.theme.colors.text.normal};
  }
  a {
    color: ${(props) => props.theme.colors.modal.link};
  }
  h1,
  h2,
  h3,
  h4 {
    color: ${(props) => props.theme.colors.modal.title};
  }

  h2 {
    display: block;
    font-size: 1.5em;
    margin-block-start: 0.83em;
    margin-block-end: 0.83em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
    font-weight: bold;
  }

  ul {
    display: block;
    list-style-type: disc;
    margin-block-start: 1em;
    margin-block-end: 1em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
    padding-inline-start: 40px;
  }

  transition: max-height 0.15s ease-out;
  overflow: hidden;
  max-height: ${(props) => props.maxHeight}px;
`;

export type Release = {
  descriptionHtml: string;
  name: string;
  publishedAt?: string;
};

type ReleaseProps = {
  release: Release;
};

enum ReleaseComponentViewState {
  "collapsed",
  "expanded",
}

const StyledReadMore = styled.div`
  padding: ${(props) => props.theme.spaces[2]}px;
  &:hover {
    background-color: ${(props) => props.theme.colors.modal.hoverState};
  }
  display: flex;
  cursor: pointer;
  .${Classes.TEXT} {
    margin-right: ${(props) => props.theme.spaces[3]}px;
  }
`;

const ReadMoreContainer = styled.div`
  display: flex;
  padding: ${(props) => props.theme.spaces[8]}px 0;
`;

const ReadMore = withTheme(
  ({
    currentState,
    onClick,
  }: {
    currentState: ReleaseComponentViewState;
    onClick: () => void;
    theme: any;
  }) => (
    <ReadMoreContainer>
      <StyledReadMore onClick={onClick}>
        <Text case={Case.UPPERCASE} color={Colors.GREY_8} type={TextType.P2}>
          {currentState === ReleaseComponentViewState.collapsed
            ? "read more"
            : "read less"}
        </Text>
        <Icon
          fillColor={Colors.GREY_8}
          name={
            currentState === ReleaseComponentViewState.collapsed
              ? "view-all"
              : "view-less"
          }
          size={IconSize.SMALL}
        />
      </StyledReadMore>
    </ReadMoreContainer>
  ),
);

function ReleaseComponent({ release }: ReleaseProps) {
  const { descriptionHtml, name, publishedAt } = release;
  const [isCollapsed, setCollapsed] = useState(true);
  const [shouldShowReadMore, setShouldShowReadMore] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      if (contentRef.current.scrollHeight >= 500) {
        setShouldShowReadMore(true);
      }
    }
  });

  const getReadMoreState = useCallback((): ReleaseComponentViewState => {
    if (isCollapsed) return ReleaseComponentViewState.collapsed;
    return ReleaseComponentViewState.expanded;
  }, [isCollapsed]);

  const toggleCollapsedState = useCallback(() => {
    setCollapsed(!isCollapsed);
  }, [isCollapsed]);

  const getHeight = useCallback(() => {
    if (!contentRef.current) return 500;
    return isCollapsed ? 500 : contentRef.current.scrollHeight;
  }, [isCollapsed]);

  return descriptionHtml ? (
    <StyledContainer>
      <Text color={Colors.BLACK} type={TextType.H1}>
        {name}
      </Text>
      <StyledDate>{moment(publishedAt).format("Do MMMM, YYYY")}</StyledDate>
      <StyledContent
        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        maxHeight={getHeight()}
        ref={contentRef}
      />
      {shouldShowReadMore && (
        <ReadMore
          currentState={getReadMoreState()}
          onClick={toggleCollapsedState}
        />
      )}
      <StyledSeparator />
    </StyledContainer>
  ) : null;
}

export default ReleaseComponent;
