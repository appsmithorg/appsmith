import React, { useEffect, useRef, useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import { Highlight as AlgoliaHighlight } from "react-instantsearch-dom";
import { Hit as IHit } from "react-instantsearch-core";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import Highlight from "./Highlight";
import ActionLink, { StyledActionLink } from "./ActionLink";
import scrollIntoView from "scroll-into-view-if-needed";
import {
  getItemType,
  getItemTitle,
  SEARCH_ITEM_TYPES,
  SearchItem,
} from "./utils";
import SearchContext from "./GlobalSearchContext";
import {
  getWidgetIcon,
  getPluginIcon,
  homePageIcon,
  pageIcon,
} from "pages/Editor/Explorer/ExplorerIcons";
import { HelpIcons } from "icons/HelpIcons";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { AppState } from "reducers";
import { keyBy, noop } from "lodash";
import { getPageList } from "selectors/editorSelectors";

const DocumentIcon = HelpIcons.DOCUMENT;

export const SearchItemContainer = styled.div<{
  isActiveItem: boolean;
  itemType: SEARCH_ITEM_TYPES;
}>`
  cursor: ${(props) =>
    props.itemType !== SEARCH_ITEM_TYPES.sectionTitle &&
    props.itemType !== SEARCH_ITEM_TYPES.placeholder
      ? "pointer"
      : "default"};
  display: flex;
  align-items: center;
  padding: ${(props) =>
    `${props.theme.spaces[4]}px ${props.theme.spaces[4]}px`};
  color: ${(props) => props.theme.colors.globalSearch.searchItemText};
  margin: ${(props) => props.theme.spaces[1]}px 0;
  background-color: ${(props) =>
    props.isActiveItem &&
    props.itemType !== SEARCH_ITEM_TYPES.sectionTitle &&
    props.itemType !== SEARCH_ITEM_TYPES.placeholder
      ? props.theme.colors.globalSearch.activeSearchItemBackground
      : "unset"};

  &:hover {
    background-color: ${(props) =>
      props.itemType !== SEARCH_ITEM_TYPES.sectionTitle &&
      props.itemType !== SEARCH_ITEM_TYPES.placeholder
        ? props.theme.colors.globalSearch.activeSearchItemBackground
        : "unset"};
    ${StyledActionLink} {
      visibility: visible;
    }
  }

  ${(props) => getTypographyByKey(props, "p3")};
  [class^="ais-"] {
    ${(props) => getTypographyByKey(props, "p3")};
  }
`;

const ItemTitle = styled.div`
  margin-left: ${(props) => props.theme.spaces[5]}px;
  display: flex;
  justify-content: space-between;
  flex: 1;
  align-items: center;
  ${(props) => getTypographyByKey(props, "p3")};
  font-w [class^="ais-"] {
    ${(props) => getTypographyByKey(props, "p3")};
  }
`;

const StyledDocumentIcon = styled(DocumentIcon)`
  && svg {
    width: 14px;
    height: 14px;
    path {
      fill: transparent;
    }
  }
  display: flex;
`;

const DocumentationItem = (props: {
  item: SearchItem;
  isActiveItem: boolean;
}) => {
  return (
    <>
      <StyledDocumentIcon />
      <ItemTitle>
        <span>
          <AlgoliaHighlight attribute="title" hit={props.item} />
        </span>
        <ActionLink item={props.item} isActiveItem={props.isActiveItem} />
      </ItemTitle>
    </>
  );
};

const WidgetIconWrapper = styled.span`
  svg {
    height: 14px;
  }
  display: flex;
`;

const usePageName = (pageId: string) => {
  const pages = useSelector(getPageList);
  const page = pages.find((page) => page.pageId === pageId);
  return page?.pageName;
};

const WidgetItem = (props: {
  query: string;
  item: SearchItem;
  isActiveItem: boolean;
}) => {
  const { query, item } = props;
  const { type } = item || {};
  let title = getItemTitle(item);
  const pageName = usePageName(item.pageId);
  title = `${title} / ${pageName}`;

  return (
    <>
      <WidgetIconWrapper>{getWidgetIcon(type)}</WidgetIconWrapper>
      <ItemTitle>
        <Highlight match={query} text={title} />
        <ActionLink item={props.item} isActiveItem={props.isActiveItem} />
      </ItemTitle>
    </>
  );
};

const ActionIconWrapper = styled.div`
  & > div {
    display: flex;
    align-items: center;
  }
`;

const ActionItem = (props: {
  query: string;
  item: SearchItem;
  isActiveItem: boolean;
}) => {
  const { item, query } = props;
  const { config } = item || {};
  const { pluginType } = config;
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const icon = getActionConfig(pluginType)?.getIcon(
    item.config,
    pluginGroups[item.config.datasource.pluginId],
  );

  let title = getItemTitle(item);
  const pageName = usePageName(config.pageId);
  title = `${title} / ${pageName}`;

  return (
    <>
      <ActionIconWrapper>{icon}</ActionIconWrapper>
      <ItemTitle>
        <Highlight match={query} text={title} />
        <ActionLink item={props.item} isActiveItem={props.isActiveItem} />
      </ItemTitle>
    </>
  );
};

const DatasourceItem = (props: {
  query: string;
  item: SearchItem;
  isActiveItem: boolean;
}) => {
  const { item, query } = props;
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const icon = getPluginIcon(pluginGroups[item.pluginId]);
  const title = getItemTitle(item);
  return (
    <>
      {icon}
      <ItemTitle>
        <Highlight match={query} text={title} />
        <ActionLink item={props.item} isActiveItem={props.isActiveItem} />
      </ItemTitle>
    </>
  );
};

const PageItem = (props: {
  query: string;
  item: SearchItem;
  isActiveItem: boolean;
}) => {
  const { query, item } = props;
  const title = getItemTitle(item);
  const icon = item.isDefault ? homePageIcon : pageIcon;

  return (
    <>
      {icon}
      <ItemTitle>
        <Highlight match={query} text={title} />
        <ActionLink item={props.item} isActiveItem={props.isActiveItem} />
      </ItemTitle>
    </>
  );
};

const StyledSectionTitleContainer = styled.div`
  display: flex;
  align-items: center;
  & .section-title__icon {
    width: 14px;
    height: 14px;
    margin-right: ${(props) => props.theme.spaces[5]}px;
  }
  & .section-title__text {
    color: ${(props) => props.theme.colors.globalSearch.sectionTitle};
  }
  margin-left: -${(props) => props.theme.spaces[3]}px;
`;

const SectionTitle = ({ item }: { item: SearchItem }) => (
  <StyledSectionTitleContainer>
    <img className="section-title__icon" src={item.icon} />
    <span className="section-title__text">{item.title}</span>
  </StyledSectionTitleContainer>
);

const Placeholder = ({ item }: { item: SearchItem }) => <div>{item.title}</div>;

const SearchItemByType = {
  [SEARCH_ITEM_TYPES.document]: DocumentationItem,
  [SEARCH_ITEM_TYPES.widget]: WidgetItem,
  [SEARCH_ITEM_TYPES.action]: ActionItem,
  [SEARCH_ITEM_TYPES.datasource]: DatasourceItem,
  [SEARCH_ITEM_TYPES.page]: PageItem,
  [SEARCH_ITEM_TYPES.sectionTitle]: SectionTitle,
  [SEARCH_ITEM_TYPES.placeholder]: Placeholder,
};

type ItemProps = {
  item: IHit | SearchItem;
  index: number;
  query: string;
};

const SearchItemComponent = (props: ItemProps) => {
  const { item, index, query } = props;
  const itemRef = useRef<HTMLDivElement>(null);
  const searchContext = useContext(SearchContext);
  const activeItemIndex = searchContext?.activeItemIndex;
  const setActiveItemIndex = searchContext?.setActiveItemIndex || noop;

  const isActiveItem = activeItemIndex === index;

  useEffect(() => {
    if (isActiveItem && itemRef.current) {
      scrollIntoView(itemRef.current, { scrollMode: "if-needed" });
    }
  }, [isActiveItem]);

  const itemType = getItemType(item);
  const Item = SearchItemByType[itemType];

  return (
    <SearchItemContainer
      ref={itemRef}
      onClick={() => {
        if (
          itemType !== SEARCH_ITEM_TYPES.sectionTitle &&
          itemType !== SEARCH_ITEM_TYPES.placeholder
        ) {
          setActiveItemIndex(index);
          if (itemType !== SEARCH_ITEM_TYPES.document) {
            searchContext?.handleItemLinkClick(item, "SEARCH_ITEM");
          }
        }
      }}
      className="t--docHit"
      isActiveItem={isActiveItem}
      itemType={itemType}
    >
      <Item item={item} query={query} isActiveItem={isActiveItem} />
    </SearchItemContainer>
  );
};

const SearchResultsContainer = styled.div`
  padding: 0 ${(props) => props.theme.spaces[6]}px;
  overflow: auto;
  width: 250px;
`;

const SearchResults = ({
  searchResults,
  query,
}: {
  searchResults: SearchItem[];
  query: string;
}) => {
  return (
    <SearchResultsContainer>
      {searchResults.map((item: SearchItem, index: number) => (
        <SearchItemComponent
          key={index}
          index={index}
          item={item}
          query={query}
        />
      ))}
    </SearchResultsContainer>
  );
};

export default SearchResults;
