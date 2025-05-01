import React, { useEffect, useRef, useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import styled, { css } from "styled-components";
import { getTypographyByKey } from "@appsmith/ads-old";
import Highlight from "./Highlight";
import ActionLink, { StyledActionLink } from "./ActionLink";
import scrollIntoView from "scroll-into-view-if-needed";
import type { SearchItem, SearchCategory } from "./utils";
import {
  getItemType,
  getItemTitle,
  SEARCH_ITEM_TYPES,
  comboHelpText,
} from "./utils";
import SearchContext from "./GlobalSearchContext";
import {
  getPluginIcon,
  homePageIcon,
  pageIcon,
  EntityIcon,
  JsFileIconV2,
} from "pages/Editor/Explorer/ExplorerIcons";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import type { DefaultRootState } from "react-redux";
import { keyBy, noop } from "lodash";
import { getPageList } from "selectors/editorSelectors";
import { PluginType } from "entities/Plugin";
import WidgetIcon from "pages/Editor/Explorer/Widgets/WidgetIcon";
import { Text } from "@appsmith/ads";

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
  padding: ${(props) => props.theme.spaces[4] + "px"};
  transition: 0.3s background-color ease;
  border-radius: var(--ads-v2-border-radius);
  background-color: ${(props) =>
    props.isActiveItem &&
    props.itemType !== SEARCH_ITEM_TYPES.sectionTitle &&
    props.itemType !== SEARCH_ITEM_TYPES.placeholder
      ? `var(--ads-v2-color-bg-muted)`
      : "unset"};

  .text {
    max-width: 300px;
    margin-right: ${(props) => `${props.theme.spaces[1]}px`};
    ${overflowCSS}
  }

  .subtext {
    font-size: 12px;
    margin-right: var(--ads-v2-spaces-2);
    display: inline;
    max-width: 300px;
    ${overflowCSS}
  }

  &:hover {
    background-color: ${(props) =>
      props.itemType !== SEARCH_ITEM_TYPES.sectionTitle &&
      props.itemType !== SEARCH_ITEM_TYPES.placeholder
        ? "var(--ads-v2-color-bg-subtle)"
        : "unset"};
    ${StyledActionLink} {
      visibility: visible;
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

  ${getTypographyByKey("p1")};
  [class^="ais-"] {
    ${getTypographyByKey("p1")};
  }
`;

const ItemTitle = styled.div`
  margin-left: ${(props) => props.theme.spaces[5]}px;
  display: flex;
  justify-content: space-between;
  flex: 1;
  align-items: center;
  ${getTypographyByKey("p1")};
  font-w [class^="ais-"] {
    ${getTypographyByKey("p1")};
  }
`;

const TextWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
`;

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
        <WidgetIcon type={type} />
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
  const plugins = useSelector((state: DefaultRootState) => {
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
      {JsFileIconV2()}
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
  const plugins = useSelector((state: DefaultRootState) => {
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
  margin-left: -${(props) => props.theme.spaces[3]}px;
`;

function SectionTitle({ item }: { item: SearchItem }) {
  return (
    <StyledSectionTitleContainer>
      {item.icon && <img className="section-title__icon" src={item.icon} />}
      <Text className="section-title__text" kind="heading-xs">
        {item.title}
      </Text>
    </StyledSectionTitleContainer>
  );
}

function Placeholder({ item }: { item: SearchItem }) {
  return <div>{item.title}</div>;
}

const CategoryContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
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
  }
  .action-msg {
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
          <Text className="category-title" kind="heading-s">
            {item.title}
          </Text>
          <Text className="category-desc" kind="body-s">
            {item.desc}
          </Text>
        </div>
        <Text className="action-msg" kind="body-s">
          {comboHelpText[item.id]}
        </Text>
      </CategoryListItem>
    </CategoryContainer>
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
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: ${(props) => (props.isActive ? 1 : 0)};
  }
`;

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ActionOperationItem({ isActiveItem, item }: any) {
  const plugins = useSelector((state: DefaultRootState) => {
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
  [SEARCH_ITEM_TYPES.widget]: WidgetItem,
  [SEARCH_ITEM_TYPES.action]: ActionItem,
  [SEARCH_ITEM_TYPES.datasource]: DatasourceItem,
  [SEARCH_ITEM_TYPES.page]: PageItem,
  [SEARCH_ITEM_TYPES.sectionTitle]: SectionTitle,
  [SEARCH_ITEM_TYPES.placeholder]: Placeholder,
  [SEARCH_ITEM_TYPES.jsAction]: JSCollectionItem,
  [SEARCH_ITEM_TYPES.category]: CategoryItem,
  [SEARCH_ITEM_TYPES.actionOperation]: ActionOperationItem,
};

interface ItemProps {
  item: SearchItem;
  index: number;
  query: string;
}

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
      className="t--searchHit"
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
  background: var(--ads-v2-color-bg);
  position: relative;
  width: 100%;
  .container {
    height: 100%;
    width: 100%;
    padding-bottom: 0;
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

export default React.memo(SearchResults);
