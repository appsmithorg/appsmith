import React, { useCallback, useEffect } from "react";
import styled from "styled-components";
import ActionLink from "./ActionLink";
import Highlight from "./Highlight";
import { getItemTitle, SEARCH_ITEM_TYPES } from "./utils";
import { getTypographyByKey } from "constants/DefaultTheme";
import { SearchItem } from "./utils";
import parseDocumentationContent from "./parseDocumentationContent";

type Props = {
  activeItem: SearchItem;
  activeItemType?: SEARCH_ITEM_TYPES;
  query: string;
  scrollPositionRef: React.MutableRefObject<number>;
};

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: ${(props) =>
    `${props.theme.spaces[5]}px ${props.theme.spaces[7]}px 0`};
  color: ${(props) => props.theme.colors.globalSearch.searchItemText};
  overflow: auto;

  ${(props) => getTypographyByKey(props, "spacedOutP1")};
  [class^="ais-"] {
    ${(props) => getTypographyByKey(props, "spacedOutP1")};
  }

  img {
    max-width: 100%;
  }

  h1 {
    ${(props) => getTypographyByKey(props, "largeH1")};
    word-break: break-word;
  }

  h1,
  h2,
  h3,
  strong {
    color: #fff;
  }

  .documentation-cta {
    ${(props) => getTypographyByKey(props, "p3")}
    white-space: nowrap;
    background: ${(props) =>
      props.theme.colors.globalSearch.documentationCtaBackground};
    color: ${(props) => props.theme.colors.globalSearch.documentationCtaText};
    padding: ${(props) => props.theme.spaces[2]}px;
    margin: 0 ${(props) => props.theme.spaces[2]}px;
    position: relative;
    bottom: 3px;
  }

  & a {
    color: ${(props) => props.theme.colors.globalSearch.documentLink};
  }

  code {
    word-break: break-word;
    background: ${(props) => props.theme.colors.globalSearch.codeBackground};
    padding: ${(props) => props.theme.spaces[2]}px;
  }

  pre {
    background: ${(props) => props.theme.colors.globalSearch.codeBackground};
    white-space: pre-wrap;
    overflow: hidden;
    padding: ${(props) => props.theme.spaces[6]}px;
  }
`;

const DocumentationDescription = ({ item }: { item: SearchItem }) => {
  try {
    const {
      _highlightResult: {
        document: { value: rawDocument },
        title: { value: rawTitle },
      },
    } = item;
    const content = parseDocumentationContent({
      rawDocument: rawDocument,
      rawTitle: rawTitle,
      path: item.path,
    });

    return content ? (
      <div dangerouslySetInnerHTML={{ __html: content }} />
    ) : null;
  } catch (e) {
    return null;
  }
};

const StyledHitEnterMessageContainer = styled.div`
  background: ${(props) =>
    props.theme.colors.globalSearch.navigateUsingEnterSection};
  padding: ${(props) =>
    `${props.theme.spaces[6]}px ${props.theme.spaces[3]}px`};
  ${(props) => getTypographyByKey(props, "p3")}
`;

const StyledKey = styled.span`
  margin: 0 ${(props) => props.theme.spaces[1]}px;
  color: ${(props) => props.theme.colors.globalSearch.navigateToEntityEnterkey};
  font-weight: bold;
`;

const StyledHighlightWrapper = styled.span`
  margin: 0 ${(props) => props.theme.spaces[1]}px;
`;

const HitEnterMessage = ({
  item,
  query,
}: {
  item: SearchItem;
  query: string;
}) => {
  const title = getItemTitle(item);

  return (
    <StyledHitEnterMessageContainer
      style={{ display: "flex", alignItems: "center" }}
    >
      &#10024; Press <StyledKey>&#8629;</StyledKey> to navigate to
      <StyledHighlightWrapper>
        <Highlight match={query} text={title} />
      </StyledHighlightWrapper>
      <ActionLink item={item} isActiveItem={true} />
    </StyledHitEnterMessageContainer>
  );
};

const descriptionByType = {
  [SEARCH_ITEM_TYPES.document]: DocumentationDescription,
  [SEARCH_ITEM_TYPES.action]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.widget]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.datasource]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.page]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.sectionTitle]: () => null,
  [SEARCH_ITEM_TYPES.placeholder]: () => null,
};

const Description = (props: Props) => {
  const { activeItem, activeItemType } = props;
  const containerRef = React.useRef<HTMLDivElement>(null);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (
      props.scrollPositionRef?.current ||
      props.scrollPositionRef?.current === 0
    ) {
      props.scrollPositionRef.current = (e.target as HTMLDivElement).scrollTop;
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = props.scrollPositionRef?.current;
    }
  }, [containerRef.current, activeItem]);

  if (!activeItemType || !activeItem) return null;
  const Component = descriptionByType[activeItemType];

  return (
    <Container onScroll={onScroll} ref={containerRef}>
      <Component item={activeItem} query={props.query} />
    </Container>
  );
};

export default Description;
