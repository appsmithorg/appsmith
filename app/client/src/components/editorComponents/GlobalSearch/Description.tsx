import React, { useCallback, useEffect } from "react";
import styled, { withTheme } from "styled-components";
import ActionLink from "./ActionLink";
import Highlight from "./Highlight";
import { getItemTitle, SEARCH_ITEM_TYPES } from "./utils";
import { getTypographyByKey, Theme } from "constants/DefaultTheme";
import marked from "marked";
import { HelpBaseURL } from "constants/HelpConstants";
import { SearchItem, algoliaHighlightTag } from "./utils";
import { htmlToElement } from "utils/helpers";

type Props = {
  activeItem: SearchItem;
  activeItemType?: SEARCH_ITEM_TYPES;
  query: string;
  scrollPositionRef: React.MutableRefObject<number>;
};

/**
 * strip:
 * gitbook plugin tags
 */
const strip = (text: string) => text.replaceAll(/{% .*?%}/gm, "");

/**
 * strip: description tag from the top
 */
const stripMarkdown = (text: string) =>
  text.replaceAll(/---\n[description]([\S\s]*?)---/gm, "");

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: ${(props) =>
    `${props.theme.spaces[5]}px ${props.theme.spaces[7]}px 0`};
  border-radius: ${(props) => props.theme.radii[2]}px;
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
    border-radius: 4px;

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

const getDocumentationCTA = (item: any) => {
  const href = item.path.replace("master", HelpBaseURL);
  const htmlString = `<a class="documentation-cta" href="${href}" target="_blank">Open Documentation</a>`;
  return htmlToElement(htmlString);
};

/**
 * Replace all H1s with H2s
 * Check first child of body
 *   if exact match as title -> replace with h1
 *   else prepend h1
 * Append open documentation button to title
 */
const updateDocumentDescriptionTitle = (
  documentObj: Document,
  activeItem: SearchItem,
) => {
  Array.from(documentObj.querySelectorAll("h1")).forEach((match: any) => {
    match.outerHTML = `<h2>${match.innerHTML}</h2>`;
  });

  let firstChild = documentObj.querySelector("body")
    ?.firstChild as HTMLElement | null;

  const title = activeItem?._highlightResult?.title?.value;
  const matchesExactly = title === firstChild?.innerHTML;

  // additional space for word-break
  if (matchesExactly && firstChild) {
    firstChild.outerHTML = `<h1>${firstChild?.innerHTML} </h1>`;
  } else {
    const h = document.createElement("h1");
    h.innerHTML = `${title} `;
    firstChild?.parentNode?.insertBefore(h, firstChild);
  }

  firstChild = documentObj.querySelector("body")
    ?.firstChild as HTMLElement | null;

  if (firstChild) {
    // append documentation button after title:
    const ctaElement = getDocumentationCTA(activeItem) as Node;
    firstChild.appendChild(ctaElement);
  }
};

const replaceHintTagsWithCode = (text: string) => {
  let result = text.replace(/{% hint .*?%}/, "```");
  result = result.replace(/{% endhint .*?%}/, "```");
  result = marked(result);
  return result;
};

const getDocumentationPreviewContent = (
  activeItem: SearchItem,
): string | undefined => {
  try {
    let { value } = activeItem?._highlightResult?.document;
    if (!value) return;

    value = stripMarkdown(value);
    value = replaceHintTagsWithCode(value);

    const parsedDocument = marked(value);

    const domparser = new DOMParser();
    const documentObj = domparser.parseFromString(parsedDocument, "text/html");

    // remove algolia highlight within code sections
    const aisTag = new RegExp(
      `&lt;${algoliaHighlightTag}&gt;|&lt;/${algoliaHighlightTag}&gt;`,
      "g",
    );
    Array.from(documentObj.querySelectorAll("code")).forEach((match) => {
      match.innerHTML = match.innerHTML.replace(aisTag, "");
    });

    // update link hrefs and target
    const aisTagEncoded = new RegExp(
      `%3C${algoliaHighlightTag}%3E|%3C/${algoliaHighlightTag}%3E`,
      "g",
    );
    Array.from(documentObj.querySelectorAll("a")).forEach((match) => {
      match.target = "_blank";
      try {
        const hrefURL = new URL(match.href);
        const isRelativeURL = hrefURL.hostname === window.location.hostname;
        match.href = !isRelativeURL
          ? match.href
          : `${HelpBaseURL}/${match.getAttribute("href")}`;
        match.href = match.href.replace(aisTagEncoded, "");
      } catch (e) {}
    });

    // update description title
    updateDocumentDescriptionTitle(documentObj, activeItem);

    const content = strip(documentObj.body.innerHTML).trim();
    return content;
  } catch (e) {
    return;
  }
};

const DocumentationDescription = ({ item }: { item: SearchItem }) => {
  const content = getDocumentationPreviewContent(item);
  return content ? (
    <div
      onKeyDown={(e) => {
        e.stopPropagation();
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  ) : null;
};

const StyledHitEnterMessageContainer = styled.div`
  background: ${(props) =>
    props.theme.colors.globalSearch.navigateUsingEnterSection};
  padding: ${(props) =>
    `${props.theme.spaces[6]}px ${props.theme.spaces[3]}px`};
  border-radius: ${(props) => props.theme.radii[1]}px;
  ${(props) => getTypographyByKey(props, "p3")}
`;

const HitEnterMessage = withTheme(
  ({
    item,
    query,
    theme,
  }: {
    item: SearchItem;
    query: string;
    theme: Theme;
  }) => {
    const title = getItemTitle(item);

    return (
      <StyledHitEnterMessageContainer
        style={{ display: "flex", alignItems: "center" }}
      >
        ✨ Press{" "}
        <kbd
          style={{
            marginLeft: theme.spaces[1],
            marginRight: theme.spaces[1],
            color: "#3DA5D9",
          }}
        >
          ↵
        </kbd>{" "}
        to navigate to
        <span
          style={{ marginLeft: theme.spaces[1], marginRight: theme.spaces[1] }}
        >
          <Highlight match={query} text={title} />
        </span>
        <ActionLink item={item} isActiveItem={true} />
      </StyledHitEnterMessageContainer>
    );
  },
);

const descriptionByType = {
  [SEARCH_ITEM_TYPES.document]: DocumentationDescription,
  [SEARCH_ITEM_TYPES.action]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.widget]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.datasource]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.page]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.sectionTitle]: () => null,
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
