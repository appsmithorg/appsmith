import React, { useEffect } from "react";
import styled from "styled-components";
import ActionLink from "./ActionLink";
import Highlight from "./Highlight";
import { algoliaHighlightTag, getItemTitle, SEARCH_ITEM_TYPES } from "./utils";
import { getTypographyByKey } from "constants/DefaultTheme";
import { SearchItem } from "./utils";
import parseDocumentationContent from "./parseDocumentationContent";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
// import javascript from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
// import xcode from "react-syntax-highlighter/dist/esm/styles/hljs/xcode";

// SyntaxHighlighter.registerLanguage("javascript", javascript);

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
    ${(props) => getTypographyByKey(props, "largeH1")};
    word-break: break-word;
  }

  h1,
  h2,
  h3,
  strong {
    color: #484848;
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
    font-size: 12px;
    background: ${(props) => props.theme.colors.globalSearch.codeBackground};
    // padding: ${(props) => props.theme.spaces[2]}px;
  }

  pre {
    background: ${(props) =>
      props.theme.colors.globalSearch.codeBackground} !important;
    white-space: pre-wrap;
    overflow: hidden;
    padding: ${(props) => props.theme.spaces[6]}px !important;
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
    <div dangerouslySetInnerHTML={{ __html: content }} ref={containerRef} />
  ) : null;
}

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

const SnippetContainer = styled.div`
  display: flex;
  flex-direction: column;
  .snippet-title {
    color: #090707;
    font-size: 17px;
    font-weight: 500;
    display: flex;
    justify-content: space-between;
    .action-msg {
      color: #a9a7a7;
      font-size: 14px;
      font-weight: 400;
    }
  }
  .snippet-desc {
    color: #4b4848;
    font-size: 14px;
    font-weight: 400;
  }
  .snippet-group {
    margin: 5px 0;
    .header {
      font-weight: 500;
      font-size: 14px;
    }
    .content {
      font-weight: 400;
      font-size: 14px;
    }
  }
`;

function SnippetDescription(props: any) {
  //Add type here
  const {
    item: { description, examples, snippet, title },
  } = props;
  return (
    <SnippetContainer>
      <div className="snippet-title">
        <span>{title}</span>
        <span className="action-msg">Hit ⏎ to insert</span>
      </div>
      <div className="snippet-desc">{description}</div>
      <SyntaxHighlighter language="javascript">{snippet}</SyntaxHighlighter>
      <div className="snippet-group">
        <div className="header">Arguments</div>
        <div className="content">array (Array): The array to concatenate.</div>
      </div>
      <div className="snippet-group">
        <div className="header">Returns</div>
        <div className="content">
          (Array): Returns the new concatenated array.
        </div>
      </div>
      {/* <pre>{snippet}</pre> */}

      {/* <SnippetArguments args={args} />
      <SnippetReturnType type={returnType} /> */}
      {examples.map((ex: any) => (
        <>
          <p>{ex.title}</p>
          <SyntaxHighlighter language="javascript">{ex.code}</SyntaxHighlighter>
          <p>{ex.summary}</p>
        </>
      ))}
    </SnippetContainer>
  );
}

const descriptionByType = {
  [SEARCH_ITEM_TYPES.document]: DocumentationDescription,
  [SEARCH_ITEM_TYPES.action]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.widget]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.datasource]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.page]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.sectionTitle]: () => null,
  [SEARCH_ITEM_TYPES.placeholder]: () => null,
  [SEARCH_ITEM_TYPES.category]: () => null,
  [SEARCH_ITEM_TYPES.snippet]: SnippetDescription,
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
