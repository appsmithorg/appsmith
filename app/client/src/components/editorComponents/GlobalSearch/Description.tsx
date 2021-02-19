import React from "react";
import styled from "styled-components";
import { SEARCH_ITEM_TYPES } from "./utils";
import { getTypographyByKey } from "constants/DefaultTheme";
import marked from "marked";
import { HelpBaseURL } from "constants/HelpConstants";

type Props = {
  activeItem: any;
  activeItemType?: SEARCH_ITEM_TYPES;
};

const algoliaHighlightTag = "ais-highlight-0000000000";

/**
 * strip:
 * image tags,
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
  & * {
    max-width: 100%;
    white-space: normal;
    overflow-wrap: break-word;
  }
  & code {
    display: block;
  }
`;

const getDocumentationPreviewContent = (
  activeItem: any,
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
    Array.from(documentObj.querySelectorAll("a")).forEach((match) => {
      match.innerHTML = match.innerHTML.replace(aisTag, "");
      match.target = "_blank";
      try {
        const hrefURL = new URL(match.href);
        const isRelativeURL = hrefURL.hostname === window.location.hostname;
        match.href = !isRelativeURL
          ? match.href
          : `${HelpBaseURL}/${match.getAttribute("href")}`;
      } catch (e) {}
    });

    const content = strip(documentObj.body.innerHTML).trim();
    return content;
  } catch (e) {
    return;
  }
};

const DocumentationDescription = ({ activeItem }: { activeItem: any }) => {
  const content = getDocumentationPreviewContent(activeItem);
  return content ? (
    <div dangerouslySetInnerHTML={{ __html: content }} />
  ) : (
    <div>no preview</div>
  );
};

const HitEnterMessage = () => (
  <span>
    Hit <kbd>↵ Return</kbd> to navigate
  </span>
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
      <Component activeItem={activeItem} />
    </Container>
  );
};

export default Description;
