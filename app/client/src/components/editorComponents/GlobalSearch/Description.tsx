import React, { useEffect, lazy, Suspense } from "react";
import styled from "styled-components";
import ActionLink from "./ActionLink";
import Highlight from "./Highlight";
import { algoliaHighlightTag, getItemTitle, SEARCH_ITEM_TYPES } from "./utils";
import { getTypographyByKey } from "constants/DefaultTheme";
import { SearchItem } from "./utils";
import parseDocumentationContent from "./parseDocumentationContent";
import { retryPromise } from "utils/AppsmithUtils";
import Skeleton from "components/utils/Skeleton";

const SnippetDescription = lazy(() =>
  retryPromise(() => import("./SnippetsDescription")),
);

type Props = {
  activeItem: SearchItem;
  activeItemType?: SEARCH_ITEM_TYPES;
  query: string;
  scrollPositionRef: React.MutableRefObject<number>;
};

const Container = styled.div`
  flex: 2;
  display: flex;
  flex-direction: column;
  margin-left: ${(props) => `${props.theme.spaces[4]}px`};
  background: white;
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
    ${(props) => getTypographyByKey(props, "docHeader")}
    word-break: break-word;
  }

  h2,
  h3 {
    ${(props) => getTypographyByKey(props, "h5")}
    font-weight: 600;
  }

  h1,
  h2,
  h3,
  strong {
    color: #484848;
  }

  table {
    margin: 0.25rem 0;
    th {
      text-align: left;
    }
    th:nth-child(1) {
      width: 150px;
    }
    th:nth-child(2) {
      width: 300px;
    }
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
    float: right;
  }

  & a {
    color: ${(props) => props.theme.colors.globalSearch.documentLink};
  }

  code {
    word-break: break-word;
    font-size: 12px;
  }

  pre {
    background: ${(props) =>
      props.theme.colors.globalSearch.documentationCodeBackground} !important;
    white-space: pre-wrap;
    overflow: hidden;
    border-left: 3px solid #f86a2b;
    padding: 12px;
  }
  .CodeMirror {
    pre {
      background: transparent !important;
    }
  }
`;

const StyledDocumentationDescription = styled.div`
  h1 {
    margin: 0.5rem 0;
    font-size: 1.5rem;
  }
  h2 {
    font-size: 1.25rem;
    margin: 0.5rem 0 0.25rem;
  }
  h3 {
    font-size: 1rem;
    margin: 0.5rem 0 0.25rem;
  }
  img,
  pre {
    margin: 0.25rem 0;
  }
  td {
    strong {
      font-weight: 600;
    }
  }
`;

function DocumentationDescription({
  item,
  query,
}: {
  item: SearchItem;
  query: string;
}) {
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
    query,
  });
  const containerRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollToMatchedValue();
  }, [content]);

  const scrollToMatchedValue = () => {
    const root = containerRef.current;
    if (!root) return;
    const list = root.getElementsByTagName(algoliaHighlightTag);
    if (list.length) {
      const bestMatch = Array.from(list).reduce((accumulator, currentValue) => {
        if (
          currentValue.textContent &&
          accumulator.textContent &&
          currentValue.textContent.length > accumulator.textContent.length
        )
          return currentValue;
        return accumulator;
      }, list[0]);

      bestMatch.scrollIntoView();
    } else {
      setTimeout(() => {
        root.firstElementChild?.scrollIntoView();
      }, 0);
    }
  };

  return content ? (
    <StyledDocumentationDescription
      dangerouslySetInnerHTML={{ __html: content }}
      ref={containerRef}
    />
  ) : null;
}

const StyledHitEnterMessageContainer = styled.div`
  background: ${(props) =>
    props.theme.colors.globalSearch.navigateUsingEnterSection};
  padding: ${(props) =>
    `${props.theme.spaces[6]}px ${props.theme.spaces[3]}px`};
  border: 1px solid
    ${(props) => props.theme.colors.globalSearch.snippets.codeContainerBorder};
  ${(props) => getTypographyByKey(props, "p3")};
`;

const StyledKey = styled.span`
  margin: 0 ${(props) => props.theme.spaces[1]}px;
  color: ${(props) => props.theme.colors.globalSearch.navigateToEntityEnterkey};
  font-weight: bold;
`;

const StyledHighlightWrapper = styled.span`
  margin: 0 ${(props) => props.theme.spaces[1]}px;
`;

function HitEnterMessage({ item, query }: { item: SearchItem; query: string }) {
  const title = getItemTitle(item);

  return (
    <StyledHitEnterMessageContainer
      style={{ display: "flex", alignItems: "center" }}
    >
      &#10024; Press <StyledKey>&#8629;</StyledKey> to navigate to
      <StyledHighlightWrapper>
        <Highlight match={query} text={title} />
      </StyledHighlightWrapper>
      <ActionLink isActiveItem item={item} />
    </StyledHitEnterMessageContainer>
  );
}

function LazySnippetDescription(props: any) {
  return (
    <Suspense fallback={<Skeleton />}>
      <SnippetDescription {...props} />
    </Suspense>
  );
}

const descriptionByType = {
  [SEARCH_ITEM_TYPES.document]: DocumentationDescription,
  [SEARCH_ITEM_TYPES.action]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.jsAction]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.widget]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.datasource]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.page]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.sectionTitle]: () => null,
  [SEARCH_ITEM_TYPES.placeholder]: () => null,
  [SEARCH_ITEM_TYPES.category]: () => null,
  [SEARCH_ITEM_TYPES.actionOperation]: () => null,
  [SEARCH_ITEM_TYPES.snippet]: LazySnippetDescription,
};

function Description(props: Props) {
  const { activeItem, activeItemType } = props;

  if (!activeItemType || !activeItem) return null;
  const Component = descriptionByType[activeItemType];

  return (
    <Container>
      <Component item={activeItem} query={props.query} />
    </Container>
  );
}

export default Description;
