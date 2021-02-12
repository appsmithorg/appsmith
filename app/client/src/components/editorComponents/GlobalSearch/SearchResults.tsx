import React, { useEffect, useRef, useContext } from "react";
import {
  Highlight as AlgoliaHighlight,
  connectHits,
} from "react-instantsearch-dom";
import { Hit as IHit } from "react-instantsearch-core";
import "instantsearch.css/themes/algolia.css";
import { HelpBaseURL } from "constants/HelpConstants";
import styled, { withTheme } from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import {
  Theme,
  getTypographyByKey,
  scrollbarDark,
} from "constants/DefaultTheme";
import scrollIntoView from "scroll-into-view-if-needed";
import { getItemType, SEARCH_ITEM_TYPES } from "./utils";
import SearchContext from "./GlobalSearchContext";

type ItemProps = {
  item: IHit | any;
  index: number;
  theme: Theme;
  isActiveItem: boolean;
  query: string;
};

const SearchItemContainer = styled.div<{ isActiveItem: boolean }>`
  ${(props) => getTypographyByKey(props, "p3")};
  [class^="ais-"] {
    ${(props) => getTypographyByKey(props, "p3")};
  }
  background-color: ${(props) =>
    props.isActiveItem
      ? props.theme.colors.globalSearch.activeSearchItemBackground
      : "unset"};
  &:hover {
    background-color: ${(props) =>
      props.theme.colors.globalSearch.activeSearchItemBackground};
  }
  display: flex;
  padding: ${(props) =>
    `${props.theme.spaces[3]}px ${props.theme.spaces[4]}px`};
  border-radius: ${(props) => props.theme.radii[2]}px;
  color: ${(props) => props.theme.colors.globalSearch.searchItemText};
  & .ais-Highlight-highlighted,
  & .search-highlighted {
    background: unset;
    color: ${(props) => props.theme.colors.globalSearch.searchItemHighlight};
    font-style: normal;
    text-decoration: underline;
    text-decoration-color: ${(props) =>
      props.theme.colors.globalSearch.highlightedTextUnderline};
  }
  margin-bottom: ${(props) => props.theme.spaces[1]}px;
`;

const ItemTitle = styled.div`
  margin-left: ${(props) => props.theme.spaces[5]}px;
`;

const DocumentationItem = withTheme((props: any) => {
  const searchContext = useContext(SearchContext);
  return (
    <>
      <Icon
        name="link"
        size={IconSize.LARGE}
        fillColor={props.theme.colors.globalSearch.searchItemText}
        onClick={() => searchContext.handleItemLinkClick(props.item)}
      />
      <ItemTitle>
        <span>
          <AlgoliaHighlight attribute="title" hit={props.item} /> -
          Documentation
        </span>
      </ItemTitle>
    </>
  );
});

const Highlight = ({ match, text }: { match: string; text: string }) => {
  const parts = text.split(match);
  if (parts.length === 1) return <span>{text}</span>;

  return (
    <span>
      {parts.map((part, index) => (
        <>
          {part}
          {index !== parts.length - 1 && (
            <span className="search-highlighted">{match}</span>
          )}
        </>
      ))}
    </span>
  );
};

const changeConstantCaseToSentenceCase = (textArg: string) => {
  if (!textArg) return "";
  const text = textArg.trim();

  return text.split("_").reduce((res, word, index) => {
    if (index === 0)
      return `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`;
    else return `${res} ${word.toLowerCase()}`;
  }, "");
};

const WidgetItem = withTheme((props: any) => {
  const { query, item } = props;
  const { widgetName, type } = item || {};
  const searchContext = useContext(SearchContext);

  return (
    <>
      <Icon
        name="link"
        size={IconSize.LARGE}
        fillColor={props.theme.colors.globalSearch.searchItemText}
        onClick={() => searchContext.handleItemLinkClick(props.item)}
      />
      <ItemTitle>
        <Highlight match={query} text={widgetName} />
        {` - ${changeConstantCaseToSentenceCase(type)}`}
      </ItemTitle>
    </>
  );
});

const ActionItem = withTheme((props: any) => {
  const { item, query } = props;
  const { config } = item || {};
  const actionType = config?.pluginType === "API" ? "API" : "Query";
  const title = config.name;
  const searchContext = useContext(SearchContext);
  return (
    <>
      <Icon
        name="link"
        size={IconSize.LARGE}
        fillColor={props.theme.colors.globalSearch.searchItemText}
        onClick={() => searchContext.handleItemLinkClick(props.item)}
      />
      <ItemTitle>
        <Highlight match={query} text={title} />
        {` - ${actionType}`}
      </ItemTitle>
    </>
  );
});

const SearchItemByType = {
  [SEARCH_ITEM_TYPES.documentation]: DocumentationItem,
  [SEARCH_ITEM_TYPES.widget]: WidgetItem,
  [SEARCH_ITEM_TYPES.action]: ActionItem,
};

const SearchItem = withTheme((props: ItemProps) => {
  const { item, isActiveItem, index, query } = props;
  const itemRef = useRef<HTMLDivElement>(null);
  // const [isMouseOver, setIsMouseOver] = useState(false);

  useEffect(() => {
    if (isActiveItem && itemRef.current) {
      scrollIntoView(itemRef.current, { scrollMode: "if-needed" });
    }
  }, [isActiveItem]);

  const itemType = getItemType(item);

  const Item = SearchItemByType[itemType];

  const { setActiveItemIndex } = useContext(SearchContext);

  // useEffect(() => {
  //   let timer: number;
  //   if (isMouseOver) {
  //     timer = setTimeout(() => {
  //       setActiveItemIndex(index);
  //     }, 200);
  //   }
  //   return () => {
  //     if (timer) {
  //       clearTimeout(timer);
  //     }
  //   };
  // }, [isMouseOver]);

  return (
    <SearchItemContainer
      ref={itemRef}
      // onMouseEnter={() => setIsMouseOver(true)}
      // onMouseLeave={() => setIsMouseOver(false)}
      onClick={() => setActiveItemIndex(index)}
      className="t--docHit"
      isActiveItem={isActiveItem}
    >
      <Item hit={item} item={item} query={query} />
    </SearchItemContainer>
  );
});

type Props = {
  hits: Array<IHit>;
  searchResults: Array<any>;
  setDocumentationSearchResults: (searchResults: Array<any>) => void;
  activeItemIndex: number;
  query: string;
};

const SearchResultsContainer = styled.div`
  padding: 0 ${(props) => props.theme.spaces[6]}px;
  overflow: auto;
  width: 250px;
  ${scrollbarDark}
`;

const SearchResults = ({
  hits,
  searchResults,
  setDocumentationSearchResults,
  query,
  activeItemIndex,
}: Props) => {
  useEffect(() => {
    setDocumentationSearchResults(hits);
  }, [hits]);

  return (
    <SearchResultsContainer>
      {searchResults.map((item, index) => (
        <SearchItem
          key={index}
          index={index}
          item={item}
          isActiveItem={activeItemIndex === index}
          query={query}
        />
      ))}
    </SearchResultsContainer>
  );
};

export default connectHits<Props, IHit>(SearchResults);
