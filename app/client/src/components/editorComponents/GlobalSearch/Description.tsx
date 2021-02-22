import React from "react";
import styled, { withTheme } from "styled-components";
import ActionLink from "./ActionLink";
import Highlight from "./Highlight";
import { getItemTitle, SEARCH_ITEM_TYPES } from "./utils";
import { getTypographyByKey, Theme } from "constants/DefaultTheme";
import marked from "marked";
import { HelpBaseURL } from "constants/HelpConstants";
import { SearchItem } from "./utils";

type Props = {
  activeItem: SearchItem;
  activeItemType?: SEARCH_ITEM_TYPES;
  query: string;
};

const algoliaHighlightTag = "ais-highlight-0000000000";

/**
 * strip:
 * gitbook plugin tags,
 * description header (since it might be present for a lot of results)
 */
const strip = (text: string) =>
  text.replaceAll(/description: &gt;-|description:|{% .*?%}|\\n/g, "");

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: ${(props) => props.theme.spaces[12]}px;
  ${(props) => getTypographyByKey(props, "p1")};
  [class^="ais-"] {
    ${(props) => getTypographyByKey(props, "p1")};
  }
  padding: ${(props) =>
    `${props.theme.spaces[3]}px ${props.theme.spaces[4]}px`};
  border-radius: ${(props) => props.theme.radii[2]}px;
  color: ${(props) => props.theme.colors.globalSearch.searchItemText};
  & ${algoliaHighlightTag}, & .ais-Highlight-highlighted,
  & .search-highlighted {
    background: unset;
    color: ${(props) => props.theme.colors.globalSearch.searchItemHighlight};
    font-style: normal;
    text-decoration: underline;
    text-decoration-color: ${(props) =>
      props.theme.colors.globalSearch.highlightedTextUnderline};
  }
  overflow: auto;
  & img {
    max-width: 100%;
  }
`;

const getDocumentationPreviewContent = (
  activeItem: SearchItem,
): string | undefined => {
  try {
    const { value } = activeItem?._highlightResult?.document;
    const parsedDocument = marked(value);
    const domparser = new DOMParser();
    const documentObj = domparser.parseFromString(parsedDocument, "text/html");

    // remove algolia highlight within from code sections
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

    //replace hints with code tags
    documentObj.body.innerHTML = documentObj.body.innerHTML.replace(
      /{% hint .*?%}/,
      "<code>",
    );
    documentObj.body.innerHTML = documentObj.body.innerHTML.replace(
      /{% endhint .*?%}/,
      "</code>",
    );

    const content = strip(documentObj.body.innerHTML).trim();
    return content;
  } catch (e) {
    return;
  }
};

const DocumentationDescription = ({ item }: { item: SearchItem }) => {
  const content = getDocumentationPreviewContent(item);
  return content ? <div dangerouslySetInnerHTML={{ __html: content }} /> : null;
};

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
      <span style={{ display: "flex", alignItems: "center" }}>
        Hit{" "}
        <kbd
          style={{ marginLeft: theme.spaces[1], marginRight: theme.spaces[1] }}
        >
          ↵ Return
        </kbd>{" "}
        to navigate to
        <span
          style={{ marginLeft: theme.spaces[1], marginRight: theme.spaces[1] }}
        >
          <Highlight match={query} text={title} />
        </span>
        <ActionLink item={item} isActiveItem={true} />
      </span>
    );
  },
);

const descriptionByType = {
  [SEARCH_ITEM_TYPES.documentation]: DocumentationDescription,
  [SEARCH_ITEM_TYPES.action]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.widget]: HitEnterMessage,
  [SEARCH_ITEM_TYPES.datasource]: HitEnterMessage,
};

const Description = (props: Props) => {
  const { activeItem, activeItemType } = props;

  if (!activeItemType || !activeItem) return null;

  const Component = descriptionByType[activeItemType];

  return (
    <Container>
      <Component item={activeItem} query={props.query} />
    </Container>
  );
};

export default Description;
