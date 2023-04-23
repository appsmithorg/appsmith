import React, { useEffect, lazy, Suspense } from "react";
import styled from "styled-components";
import ActionLink from "./ActionLink";
import Highlight from "./Highlight";
import { algoliaHighlightTag, getItemTitle, SEARCH_ITEM_TYPES } from "./utils";
import { getTypographyByKey } from "design-system-old";
import type { SearchItem } from "./utils";
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
  background: var(--ads-v2-color-bg);
  padding: ${(props) =>
    `${props.theme.spaces[5]}px ${props.theme.spaces[7]}px 0`};
  color: var(--ads-v2-color-fg);
  overflow: auto;
  border-left: 1px solid var(--ads-v2-color-border);
  font-size: 13px;
  [class^="ais-"] {
    ${getTypographyByKey("spacedOutP1")};
  }

  img {
    max-width: 100%;
  }

  h1 {
    word-break: break-word;
    color: var(--ads-v2-color-fg-emphasis-plus) !important;
    font-size: 16px !important;
    font-weight: var(--ads-v2-font-weight-bold);
    letter-spacing: var(--ads-v2-p-letter-spacing);
  }

  h2,
  h3 {
    ${getTypographyByKey("h5")}
    font-weight: 600;
  }

  h1,
  h2,
  h3,
  strong,
  p {
    color: var(--ads-v2-color-fg);
    font-size: 13px;
    margin: 0.25rem 0;
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
    --button-font-weight: 600;
    --button-font-size: 12px;
    --button-padding: var(--ads-v2-spaces-2) var(--ads-v2-spaces-3);
    --button-gap: var(--ads-v2-spaces-2);
    --button-color-bg: transparent;
    --button-color-fg: var(--ads-v2-color-fg);
    mix-blend-mode: multiply;

    position: relative;
    font-size: var(--button-font-size);
    cursor: pointer;
    border: none;
    background-color: transparent;
    color: var(--button-color-fg);
    text-decoration: none;
    height: var(--button-height);
    box-sizing: border-box;
    overflow: hidden;
    min-width: min-content;
    border-radius: var(--ads-v2-border-radius) !important;

    display: inline-flex;
    align-self: center;
    gap: var(--button-gap);
    background-color: var(--button-color-bg);
    border: 1px solid var(--ads-v2-color-border);
    box-sizing: border-box;
    padding: var(--button-padding);
    text-transform: capitalize;
    &:hover {
      --button-color-bg: var(--ads-v2-color-bg-subtle);
      --button-color-fg: var(--ads-v2-color-fg);
    }
  }

  & a {
    color: var(--ads-v2-color-bg-brand);
  }

  code {
    word-break: break-word;
    font-size: 13px;
  }

  pre {
    background: var(--ads-v2-color-bg-subtle) !important;
    white-space: pre-wrap;
    overflow: hidden;
    border-left: 3px solid var(--ads-v2-color-bg-brand);
    padding: var(--ads-v2-spaces-4);
    border-radius: var(--ads-v2-border-radius);
  }
  .CodeMirror {
    pre {
      background: transparent !important;
    }
  }

  object {
    width: 100%;
    height: 280px;
  }

  ul,
  ol {
    list-style: revert;
    padding: revert;
    margin: revert;
  }
`;

const StyledDocumentationDescription = styled.div`
  h1 {
    margin: 0.5rem 0;
    display: flex;
    justify-content: space-between;
  }
  h2 {
    margin: 0.5rem 0 0.25rem;
  }
  h3 {
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
  ${getTypographyByKey("p3")};
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
    <Container data-cy="description">
      <Component item={activeItem} query={props.query} />
    </Container>
  );
}

export default Description;
