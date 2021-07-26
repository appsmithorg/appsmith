import React, { useEffect, useRef, useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import { Highlight as AlgoliaHighlight } from "react-instantsearch-dom";
import { Hit as IHit } from "react-instantsearch-core";
import styled, { css } from "styled-components";
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
  apiIcon,
} from "pages/Editor/Explorer/ExplorerIcons";
import { HelpIcons } from "icons/HelpIcons";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import { AppState } from "reducers";
import { keyBy, noop } from "lodash";
import { getPageList } from "selectors/editorSelectors";
import { PluginType } from "entities/Action";

const DocumentIcon = HelpIcons.DOCUMENT;

const overflowCSS = css`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

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
  color: ${(props) =>
    props.isActiveItem
      ? "white"
      : props.theme.colors.globalSearch.searchItemText};
  margin: ${(props) => props.theme.spaces[1]}px 0;
  background-color: ${(props) =>
    props.isActiveItem &&
    props.itemType !== SEARCH_ITEM_TYPES.sectionTitle &&
    props.itemType !== SEARCH_ITEM_TYPES.placeholder
      ? props.theme.colors.globalSearch.activeSearchItemBackground
      : "unset"};

  .text {
    max-width: 100px;
    color: ${(props) =>
      props.isActiveItem
        ? "white"
        : props.theme.colors.globalSearch.searchItemText};
    font-size: ${(props) => props.theme.fontSizes[3]}px;
    font-weight: ${(props) => props.theme.fontWeights[1]};
    margin-right: ${(props) => `${props.theme.spaces[1]}px`};
    ${overflowCSS}
  }

  .subtext {
    color: ${(props) => props.theme.colors.globalSearch.searchItemSubText};
    font-size: ${(props) => props.theme.fontSizes[3]}px;
    font-weight: ${(props) => props.theme.fontWeights[1]};
    margin-right: ${(props) => `${props.theme.spaces[2]}px`};
    display: inline;
    max-width: 50px;
    ${overflowCSS}
  }

  &:hover {
    background-color: ${(props) =>
      props.itemType !== SEARCH_ITEM_TYPES.sectionTitle &&
      props.itemType !== SEARCH_ITEM_TYPES.placeholder
        ? props.theme.colors.globalSearch.activeSearchItemBackground
        : "unset"};
    color: white;
    .category-title {
      color: white;
    }
    .category-desc {
      color: white;
    }
    ${StyledActionLink} {
      visibility: visible;
    }

    .subtext,
    .text {
      color: white;
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

const TextWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: flex-start;
  font-size: 14px;
`;

function DocumentationItem(props: { item: SearchItem; isActiveItem: boolean }) {
  return (
    <>
      <StyledDocumentIcon />
      <ItemTitle>
        <span>
          <AlgoliaHighlight attribute="title" hit={props.item} />
        </span>
        <ActionLink isActiveItem={props.isActiveItem} item={props.item} />
      </ItemTitle>
    </>
  );
}

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

function WidgetItem(props: {
  query: string;
  item: SearchItem;
  isActiveItem: boolean;
}) {
  const { item, query } = props;
  const { type } = item || {};
  const title = getItemTitle(item);
  const pageName = usePageName(item.pageId);
  const subText = ` / ${pageName}`;

  return (
    <>
      <WidgetIconWrapper>{getWidgetIcon(type)}</WidgetIconWrapper>
      <ItemTitle>
        <TextWrapper>
          <Highlight className="text" match={query} text={title} />
          <Highlight className="subtext" match={query} text={subText} />
        </TextWrapper>
        <ActionLink isActiveItem={props.isActiveItem} item={props.item} />
      </ItemTitle>
    </>
  );
}

const ActionIconWrapper = styled.div`
  & > div {
    display: flex;
    align-items: center;
  }
`;

function ActionItem(props: {
  query: string;
  item: SearchItem;
  isActiveItem: boolean;
}) {
  const { item, query } = props;
  const { config } = item || {};
  const { pluginType } = config;
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const icon =
    pluginType === PluginType.API
      ? apiIcon
      : getActionConfig(pluginType)?.getIcon(
          item.config,
          pluginGroups[item.config.datasource.pluginId],
        );

  const title = getItemTitle(item);
  const pageName = usePageName(config.pageId);
  const subText = `/  ${pageName}`;

  return (
    <>
      <ActionIconWrapper>{icon}</ActionIconWrapper>
      <ItemTitle>
        <TextWrapper>
          <Highlight className="text" match={query} text={title} />
          <Highlight className="subtext" match={query} text={subText} />
        </TextWrapper>
        <ActionLink isActiveItem={props.isActiveItem} item={props.item} />
      </ItemTitle>
    </>
  );
}

function DatasourceItem(props: {
  query: string;
  item: SearchItem;
  isActiveItem: boolean;
}) {
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
        <Highlight className="text" match={query} text={title} />
        <ActionLink isActiveItem={props.isActiveItem} item={props.item} />
      </ItemTitle>
    </>
  );
}

function PageItem(props: {
  query: string;
  item: SearchItem;
  isActiveItem: boolean;
}) {
  const { item, query } = props;
  const title = getItemTitle(item);
  const icon = item.isDefault ? homePageIcon : pageIcon;

  return (
    <>
      {icon}
      <ItemTitle>
        <Highlight className="text" match={query} text={title} />
        <ActionLink isActiveItem={props.isActiveItem} item={props.item} />
      </ItemTitle>
    </>
  );
}

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

function SectionTitle({ item }: { item: SearchItem }) {
  return (
    <StyledSectionTitleContainer>
      <img className="section-title__icon" src={item.icon} />
      <span className="section-title__text">{item.title}</span>
    </StyledSectionTitleContainer>
  );
}

function Placeholder({ item }: { item: SearchItem }) {
  return <div>{item.title}</div>;
}

const CategoryContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-item: center;
  justify-content: space-between;
  padding: 12px 10px;
`;

const CategoryListItem = styled.div<{ isActiveItem: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  .category-title {
    ${(props) => getTypographyByKey(props, "h5")}
    color: ${(props) => (props.isActiveItem ? "white" : "#4b4848")};
  }
  .category-desc {
    ${(props) => getTypographyByKey(props, "p3")}
    color: ${(props) => (props.isActiveItem ? "white" : "#a9a7a7")};
  }
`;

function CategoryItem({
  isActiveItem,
  item,
}: {
  item: SearchItem;
  isActiveItem: boolean;
}) {
  return (
    <CategoryContainer>
      <CategoryListItem isActiveItem={isActiveItem}>
        <span className="category-title">{item.title}</span>
        <span className="category-desc">{item.desc}</span>
      </CategoryListItem>
    </CategoryContainer>
  );
}

const SearchItemByType = {
  [SEARCH_ITEM_TYPES.document]: DocumentationItem,
  [SEARCH_ITEM_TYPES.widget]: WidgetItem,
  [SEARCH_ITEM_TYPES.action]: ActionItem,
  [SEARCH_ITEM_TYPES.datasource]: DatasourceItem,
  [SEARCH_ITEM_TYPES.page]: PageItem,
  [SEARCH_ITEM_TYPES.sectionTitle]: SectionTitle,
  [SEARCH_ITEM_TYPES.placeholder]: Placeholder,
  [SEARCH_ITEM_TYPES.category]: CategoryItem,
};

type ItemProps = {
  item: IHit | SearchItem;
  index: number;
  query: string;
};

function SearchItemComponent(props: ItemProps) {
  const { index, item, query } = props;
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
      className="t--docHit"
      isActiveItem={isActiveItem}
      itemType={itemType}
      onClick={() => {
        if (
          itemType !== SEARCH_ITEM_TYPES.sectionTitle &&
          itemType !== SEARCH_ITEM_TYPES.placeholder
        ) {
          setActiveItemIndex(index);
          searchContext?.handleItemLinkClick(item, "SEARCH_ITEM");
        }
      }}
      ref={itemRef}
    >
      <Item isActiveItem={isActiveItem} item={item} query={query} />
    </SearchItemContainer>
  );
}

const SearchResultsContainer = styled.div`
  overflow: auto;
  flex: 1;
  background: white;
`;

function SearchResults({
  query,
  searchResults,
}: {
  searchResults: SearchItem[];
  query: string;
}) {
  return (
    <SearchResultsContainer>
      {searchResults.map((item: SearchItem, index: number) => (
        <SearchItemComponent
          index={index}
          item={item}
          key={index}
          query={query}
        />
      ))}
    </SearchResultsContainer>
  );
}

export default SearchResults;
