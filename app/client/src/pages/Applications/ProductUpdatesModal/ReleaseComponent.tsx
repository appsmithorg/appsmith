import React, { useState, useRef, useEffect, useCallback } from "react";
import styled from "styled-components";
import moment from "moment";
import "@github/g-emoji-element";
import { Divider, Text, Button, Tag } from "@appsmith/ads";

const StyledContainer = styled.div`
  color: ${(props) => props.theme.colors.text.normal};
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
`;

const TagContainer = styled.div`
  display: flex;
  align-items: baseline;
  margin-bottom: 16px;
`;

const StyledDate = styled.div`
  font-weight: ${(props) => props.theme.typography.releaseList.fontWeight};
  font-size: 12px;
  line-height: ${(props) => props.theme.typography.releaseList.lineHeight}px;
  letter-spacing: ${(props) =>
    props.theme.typography.releaseList.letterSpacing}px;
  color: var(--ads-v2-color-fg);
  margin-top: ${(props) => props.theme.spaces[3]}px;
  margin-left: 4px;
`;

const StyledContent = styled.div<{ maxHeight: number }>`
  li,
  p {
    font-weight: ${(props) => props.theme.typography.releaseList.fontWeight};
    font-size: ${(props) => props.theme.typography.releaseList.fontSize}px;
    line-height: ${(props) => props.theme.typography.releaseList.lineHeight}px;
    letter-spacing: ${(props) =>
      props.theme.typography.releaseList.letterSpacing}px;
    color: var(--ads-v2-color-fg);
  }
  a {
    color: var(--ads-v2-color-fg-brand);
  }
  h1,
  h2,
  h3,
  h4 {
    color: var(--ads-v2-color-fg-emphasis-plus);
  }

  h2 {
    display: block;
    font-size: 16px;
    margin-block-start: 0.83em;
    margin-block-end: 0.83em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
    font-weight: 500;
    color: var(--ads-v2-color-fg-emphasis-plus);
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

export interface Release {
  descriptionHtml: string;
  name: string;
  publishedAt?: string;
  tagName: string;
}

interface ReleaseProps {
  release: Release;
}

enum ReleaseComponentViewState {
  "collapsed",
  "expanded",
}

const ReadMoreContainer = styled.div`
  display: flex;
  padding: ${(props) => props.theme.spaces[8]}px 0;
`;

const ReadMore = ({
  currentState,
  onClick,
}: {
  currentState: ReleaseComponentViewState;
  onClick: () => void;
}) => (
  <ReadMoreContainer>
    <Button
      endIcon={
        currentState === ReleaseComponentViewState.collapsed
          ? "arrow-right-line"
          : "arrow-left-line"
      }
      kind="tertiary"
      onClick={onClick}
      renderAs="button"
      startIcon=""
    >
      {currentState === ReleaseComponentViewState.collapsed
        ? "Read more"
        : "Read less"}
    </Button>
  </ReadMoreContainer>
);

function ReleaseComponent({ release }: ReleaseProps) {
  const { descriptionHtml, name, publishedAt, tagName } = release;
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
      <TagContainer>
        <Tag isClosable={false} size="md">
          {tagName}
        </Tag>
        <StyledDate>{moment(publishedAt).format("D MMM YYYY")}</StyledDate>
      </TagContainer>
      <Text kind="heading-s">{name}</Text>
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
      <Divider />
    </StyledContainer>
  ) : null;
}

export default ReleaseComponent;
