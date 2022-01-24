import React, { useEffect, useRef, useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import { Highlight as AlgoliaHighlight } from "react-instantsearch-dom";
import { Hit as IHit } from "react-instantsearch-core";
import styled, { css } from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import Highlight from "./Highlight";
import ActionLink, { StyledActionLink } from "./ActionLink";
import scrollIntoView from "scroll-into-view-if-needed";
import { ReactComponent as Snippet } from "assets/icons/ads/snippet.svg";
import {
  getItemType,
  getItemTitle,
  SEARCH_ITEM_TYPES,
  SearchItem,
  SearchCategory,
  comboHelpText,
  isSnippet,
} from "./utils";
import SearchContext from "./GlobalSearchContext";
import {
  getWidgetIcon,
  getPluginIcon,
  homePageIcon,
  pageIcon,
  EntityIcon,
  JsFileIconV2,
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
  padding: ${(props) => props.theme.spaces[4]}px};
  color: ${(props) => props.theme.colors.globalSearch.searchItemText};
  transition: 0.3s background-color ease;
  background-color: ${(props) =>
    props.isActiveItem &&
    props.itemType !== SEARCH_ITEM_TYPES.sectionTitle &&
    props.itemType !== SEARCH_ITEM_TYPES.placeholder
      ? `${props.theme.colors.globalSearch.activeSearchItemBackground} !important`
      : "unset"};

  .text {
    max-width: 300px;
    color: ${(props) => props.theme.colors.globalSearch.searchItemText};
    font-size: ${(props) => props.theme.fontSizes[3]}px;
    font-weight: ${(props) => props.theme.fontWeights[1]};
    margin-right: ${(props) => `${props.theme.spaces[1]}px`};
    ${overflowCSS}
  }

  .subtext {
    color: ${(props) => props.theme.colors.globalSearch.searchItemSubText};
    font-size: ${(props) => props.theme.fontSizes[2]}px;
    font-weight: ${(props) => props.theme.fontWeights[1]};
    margin-right: ${(props) => `${props.theme.spaces[2]}px`};
    display: inline;
    max-width: 300px;
    ${overflowCSS}
  }

  &:hover {
    background-color: ${(props) =>
      props.itemType !== SEARCH_ITEM_TYPES.sectionTitle &&
      props.itemType !== SEARCH_ITEM_TYPES.placeholder
        ? "#E8E8E8"
        : "unset"};
    ${StyledActionLink} {
      visibility: visible;
      &:hover {
        transform: scale(1.2);
      }
    }
    .operation-desc {
      opacity: 1;
    }
    .icon-wrapper {
      svg {
        path: {
          fill: #484848 !important;
        }
      }
    }
  }

  ${(props) => getTypographyByKey(props, "p1")};
  [class^="ais-"] {
    ${(props) => getTypographyByKey(props, "p1")};
  }
`;

const ItemTitle = styled.div`
  margin-left: ${(props) => props.theme.spaces[5]}px;
  display: flex;
  justify-content: space-between;
  flex: 1;
  align-items: center;
  ${(props) => getTypographyByKey(props, "p1")};
  font-w [class^="ais-"] {
    ${(props) => getTypographyByKey(props, "p1")};
  }
`;

const StyledDocumentIcon = styled(DocumentIcon)<{ isActiveItem: boolean }>`
  && svg {
    width: 14px;
    height: 14px;
    path {
      fill: #716e6e !important;
    }
  }
  display: flex;
`;

const TextWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
`;

function DocumentationItem(props: { item: SearchItem; isActiveItem: boolean }) {
  return (
    <>
      <StyledDocumentIcon isActiveItem={props.isActiveItem} />
      <ItemTitle>
        <span>
          <AlgoliaHighlight attribute="title" hit={props.item} />
        </span>
        <ActionLink isActiveItem={props.isActiveItem} item={props.item} />
      </ItemTitle>
    </>
  );
}

const WidgetIconWrapper = styled.span<{ isActiveItem: boolean }>`
  display: flex;
  svg {
    height: 14px;
    path {
      fill: #716e6e !important;
    }
  }
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
  const subText = `${pageName}`;

  return (
    <>
      <WidgetIconWrapper
        className="icon-wrapper"
        isActiveItem={props.isActiveItem}
      >
        {getWidgetIcon(type)}
      </WidgetIconWrapper>
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
  const icon = getActionConfig(pluginType)?.getIcon(
    item.config,
    pluginGroups[item.config.datasource.pluginId],
    pluginType === PluginType.API,
  );

  const title = getItemTitle(item);
  const pageName = usePageName(config.pageId);
  const subText = `${pageName}`;

  return (
    <>
      {icon}
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

function JSCollectionItem(props: {
  query: string;
  item: SearchItem;
  isActiveItem: boolean;
}) {
  const { item, query } = props;
  const { config } = item || {};
  const title = getItemTitle(item);
  const pageName = usePageName(config.pageId);
  const subText = `${pageName}`;

  return (
    <>
      {JsFileIconV2}
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
    margin-left: ${(props) => props.theme.spaces[3]}px;
  }
  & .section-title__text {
    color: ${(props) => props.theme.colors.globalSearch.sectionTitle};
    font-size: 12px;
    font-weight: 600;
  }
  margin-left: -${(props) => props.theme.spaces[3]}px;
`;

function SectionTitle({ item }: { item: SearchItem }) {
  return (
    <StyledSectionTitleContainer>
      {item.icon && <img className="section-title__icon" src={item.icon} />}
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
  width: 100%;
`;

const CategoryListItem = styled.div<{ isActiveItem: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  .content {
    display: flex;
    flex-direction: column;
    .category-title {
      ${(props) => getTypographyByKey(props, "h5")}
      color: ${(props) => props.theme.colors.globalSearch.primaryTextColor};
    }
    .category-desc {
      ${(props) => getTypographyByKey(props, "p3")}
      color: ${(props) => props.theme.colors.globalSearch.secondaryTextColor};
    }
  }
  .action-msg {
    color: ${(props) => props.theme.colors.globalSearch.secondaryTextColor};
    ${(props) => getTypographyByKey(props, "p3")}
    flex-shrink: 0;
  }
`;

function CategoryItem({
  isActiveItem,
  item,
}: {
  item: SearchCategory;
  isActiveItem: boolean;
}) {
  return (
    <CategoryContainer>
      <CategoryListItem isActiveItem={isActiveItem}>
        <div className="content">
          <span className="category-title">{item.title}</span>
          <span className="category-desc">{item.desc}</span>
        </div>
        <div className="action-msg">{comboHelpText[item.id]}</div>
      </CategoryListItem>
    </CategoryContainer>
  );
}

const FlexWrapper = styled.div`
  display: flex;
  align-items: center;
  && svg {
    width: 14px;
    height: 14px;
    path {
      fill: #716e6e !important;
    }
  }
  && svg.snippet-icon {
    width: 18px;
    height: 18px;
  }
`;

function SnippetItem({ item: { body } }: any) {
  return (
    <FlexWrapper>
      <Snippet className="snippet-icon" />
      <ItemTitle>
        <span>{body.shortTitle || body.title}</span>
      </ItemTitle>
    </FlexWrapper>
  );
}

const ActionOperation = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  .action-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }
  .operation-title {
    padding: 0 10px;
    max-width: 50%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .operation-desc {
    color: gray;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: ${(props) => (props.isActive ? 1 : 0)};
  }
`;

function ActionOperationItem({ isActiveItem, item }: any) {
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);
  const icon = item.pluginId && getPluginIcon(pluginGroups[item.pluginId]);
  return (
    <ActionOperation isActive={isActiveItem}>
      <div className="action-icon">
        {item.icon ? item.icon : <EntityIcon>{icon}</EntityIcon>}
      </div>
      <span className="operation-title t--file-operation">{item.title}</span>
      {item.desc && <span className="operation-desc"> ~ {item.desc}</span>}
    </ActionOperation>
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
  [SEARCH_ITEM_TYPES.jsAction]: JSCollectionItem,
  [SEARCH_ITEM_TYPES.category]: CategoryItem,
  [SEARCH_ITEM_TYPES.snippet]: SnippetItem,
  [SEARCH_ITEM_TYPES.actionOperation]: ActionOperationItem,
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
      onClick={(e: React.MouseEvent) => {
        if (
          itemType !== SEARCH_ITEM_TYPES.sectionTitle &&
          itemType !== SEARCH_ITEM_TYPES.placeholder
        ) {
          setActiveItemIndex(index);
          searchContext?.handleItemLinkClick(e, item, "SEARCH_ITEM");
        }
      }}
      ref={itemRef}
    >
      <Item isActiveItem={isActiveItem} item={item} query={query} />
    </SearchItemContainer>
  );
}

const SearchResultsContainer = styled.div<{ category: SearchCategory }>`
  flex: 1;
  background: white;
  position: relative;
  width: 100%;
  .container {
    overflow: auto;
    height: 100%;
    width: 100%;
    padding-bottom: ${(props) => (isSnippet(props.category) ? "50px" : "0")};
  }
`;

function SearchResults({
  category,
  query,
  searchResults,
}: {
  searchResults: SearchItem[];
  query: string;
  category: SearchCategory;
}) {
  return (
    <SearchResultsContainer category={category}>
      <div className="container">
        {searchResults.map((item: SearchItem, index: number) => (
          <SearchItemComponent
            index={index}
            item={item}
            key={index}
            query={query}
          />
        ))}
      </div>
    </SearchResultsContainer>
  );
}

export default SearchResults;
