import { setPageOrder } from "actions/pageActions";
import styled from "styled-components";
import type { Page } from "entities/Page";
// import classNames from "classnames";
import { DraggableList } from "@appsmith/ads-old";
import { MenuIcons } from "icons/MenuIcons";
import React, { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { Flex, Icon } from "@appsmith/ads";

const DefaultPageIcon = MenuIcons.DEFAULT_HOMEPAGE_ICON;
const PageIcon = MenuIcons.PAGE_ICON;

const Wrapper = styled.div<{ isSelected: boolean }>`
  height: 37px;
  background-color: ${({ isSelected }) =>
    isSelected ? "var(--ads-v2-color-bg-muted)" : "transparent"};

  &:hover {
    background-color: ${({ isSelected }) =>
      isSelected
        ? "var(--ads-v2-color-bg-muted)"
        : "var(--ads-v2-color-bg-subtle)"};
  }
`;

const PageName = styled.p`
  font-size: var(--ads-v2-font-size-4);
  font-weight: var(--ads-v2-font-weight-bold);
  color: var(--ads-v2-color-fg-emphasis);
  padding-left: 0.25rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`;

function PageListHeader(props: {
  page: Page;
  selectedPage?: string;
  onPageSelect: (pageId: string) => void;
}) {
  const dragContainerRef = useRef(null);

  return (
    <Wrapper
      className="flex items-center cursor-pointer"
      id={`t--page-settings-${props.page.pageName}`}
      isSelected={props.selectedPage === props.page.pageId}
      onClick={() => {
        props.onPageSelect(props.page.pageId);
      }}
    >
      <div
        className="px-1"
        onClick={(e) => e.stopPropagation()}
        ref={dragContainerRef}
      >
        <Icon name="drag-control" size="md" />
      </div>
      {props.page.isDefault ? (
        <DefaultPageIcon
          color="var(--ads-v2-color-fg)"
          height={16}
          width={16}
        />
      ) : (
        <PageIcon color="var(--ads-v2-color-fg)" height={16} width={16} />
      )}
      <PageName
        id={
          props.page.isDefault
            ? "t--page-settings-default-page"
            : "t--page-settings-non-default-page"
        }
      >
        {props.page.pageName}
      </PageName>
    </Wrapper>
  );
}

function DraggablePageList(props: {
  pages: Page[];
  selectedPage?: string;
  onPageSelect: (pageId: string) => void;
  heightTobeReduced?: string;
}) {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);

  const onListOrderUpdate = (
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newOrder: any,
    originalIndex: number,
    newIndex: number,
  ) => {
    dispatch(
      setPageOrder(applicationId, props.pages[originalIndex].pageId, newIndex),
    );
  };

  return (
    <Flex
      flexDirection="column"
      height={
        props.heightTobeReduced
          ? `calc(100% - ${props.heightTobeReduced})`
          : `100%`
      }
      overflowX="auto"
      px="spaces-3"
    >
      <DraggableList
        ItemRenderer={({ item }: { item: Page }) => (
          <PageListHeader
            onPageSelect={props.onPageSelect}
            page={item}
            selectedPage={props.selectedPage}
          />
        )}
        itemHeight={37}
        items={props.pages}
        keyAccessor={"pageId"}
        onUpdate={onListOrderUpdate}
        shouldReRender={false}
      />
    </Flex>
  );
}

export default DraggablePageList;
