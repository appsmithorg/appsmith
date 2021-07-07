import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router";
import styled from "styled-components";
import { AppState } from "reducers";
import { APIEditorRouteParams } from "constants/routes";
import { Spinner, IIconProps } from "@blueprintjs/core";
import { BaseTextInput } from "components/designSystems/appsmith/TextInputComponent";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import Fuse from "fuse.js";
import Button from "components/editorComponents/Button";
import {
  DragDropContext,
  Draggable,
  DragStart,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import { PageListPayload } from "constants/ReduxActionConstants";
import TreeDropdown from "pages/Editor/Explorer/TreeDropdown";
import { theme } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { ControlIcons } from "icons/ControlIcons";

const LoadingContainer = styled(CenteredWrapper)`
  height: 50%;
`;

const Wrapper = styled.div`
  height: 100%;
  width: 100%;
  flex-direction: column;
`;

const Controls = styled.div`
  padding: 10px;
`;

const SearchBar = styled(BaseTextInput)`
  margin-bottom: 10px;
  input {
    background-color: #23292e;
    border: none;
    color: ${(props) => props.theme.colors.textOnDarkBG}
    :focus {
      background-color: #23292e;
    }
  }
  .bp3-icon {
    background-color: #23292e;
  }
`;

const PageContainer = styled.div`
  padding: 5px 0;
`;

const PageName = styled.h5<{ isMain: boolean }>`
  display: block;
  width: 100%;
  height: 20px;
  padding-left: 5px;
  font-size: 16px;
  color: white;
  border-right: 4px solid;
  margin: 10px 0;
  border-color: ${(props) =>
    props.isMain ? props.theme.colors.primaryOld : "transparent"};
`;

const PageDropContainer = styled.div`
  min-height: 32px;
  margin: 5px;
  background-color: ${(props) => props.theme.colors.paneBG};

  .createBtn {
    border: none;
    color: ${Colors.WHITE} !important;
    width: 100%;
    display: block !important;
    font-weight: normal;
    font-size: 14px;
    line-height: 20px;

    &:hover {
      color: ${Colors.WHITE} !important;
      background-color: ${Colors.BLUE_CHARCOAL} !important;

      svg {
        path {
          fill: ${Colors.WHITE};
        }
      }
    }
    &:focus {
      color: ${Colors.WHITE} !important;
      background-color: ${Colors.BLUE_CHARCOAL} !important;

      svg {
        path {
          fill: ${Colors.WHITE};
        }
      }
    }
  }
  .highlightButton {
    color: ${Colors.WHITE} !important;
    background-color: ${Colors.BLUE_CHARCOAL} !important;
    width: 100%;
    display: block !important;
    font-weight: normal;
    font-size: 14px;
    line-height: 20px;

    svg {
      path {
        fill: ${Colors.WHITE};
      }
    }
  }

  .linkStyles {
    text-decoration: none !important;
  }
`;

const ItemsWrapper = styled.div`
  flex: 1;
`;

const NoItemMessage = styled.div`
  color: #d0d7dd;
  padding-left: 12px;
  padding-top: 23px;
  font-size: 14px;
  line-height: 20px;
  padding-bottom: 10px;
`;

const ItemContainer = styled.div<{
  isSelected: boolean;
  isDraggingOver: boolean;
  isBeingDragged: boolean;
}>`
  height: 32px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${(props) =>
    props.isSelected || props.isBeingDragged
      ? props.theme.colors.paneCard
      : props.theme.colors.paneBG};
  :hover {
    background-color: ${(props) =>
      props.isDraggingOver
        ? props.theme.colors.paneBG
        : props.theme.colors.paneCard};
  }
`;

const StyledAddButton = styled(Button)<IIconProps>`
  &&& {
    outline: none;

    padding: 10px !important;
  }
  span {
    font-weight: normal !important;
  }
`;

interface ReduxStateProps {
  pages: PageListPayload;
}

type Item = { id: string; name: string; pageId: string };
type PageWiseList = Array<{ name: string; id: string; items: Item[] }>;

type EditorSidebarComponentProps = {
  isLoading: boolean;
  list: Array<Item>;
  selectedItemId?: string;
  itemRender: (item: any) => JSX.Element;
  onItemCreateClick: (pageId: string) => void;
  onItemSelected: (itemId: string, itemPageId: string) => void;
  moveItem: (itemId: string, destinationPageId: string) => void;
  copyItem: (itemId: string, destinationPageId: string) => void;
  deleteItem: (itemId: string, itemName: string, pageName: string) => void;
  createButtonTitle: string;
};

type Props = ReduxStateProps &
  RouteComponentProps<APIEditorRouteParams> &
  EditorSidebarComponentProps;

type State = {
  search: string;
  itemDraggingFrom: string;
  itemDragging: string;
};

const FUSE_OPTIONS = {
  shouldSort: true,
  threshold: 0.5,
  location: 0,
  minMatchCharLength: 3,
  findAllMatches: true,
  keys: ["name"],
};

class EditorSidebar extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      search: "",
      itemDraggingFrom: "",
      itemDragging: "",
    };
  }

  handleSearchChange = (e: React.ChangeEvent<{ value: string }>) => {
    const value = e.target.value;
    this.setState({
      search: value,
    });
  };

  handleItemSelect = (itemId: string, itemPageId: string) => {
    this.props.onItemSelected(itemId, itemPageId);
  };

  onDragEnd = (result: DropResult) => {
    this.setState({
      itemDraggingFrom: "",
      itemDragging: "",
    });
    if (
      result.destination &&
      result.source.droppableId !== result.destination.droppableId
    ) {
      this.props.moveItem(result.draggableId, result.destination.droppableId);
    }
  };

  onDragStart = (result: DragStart) => {
    const draggingFrom = result.source.droppableId;
    this.setState({
      itemDraggingFrom: draggingFrom,
      itemDragging: result.draggableId,
    });
  };

  getSearchFilteredList = () => {
    const { search } = this.state;
    const { list } = this.props;
    const fuse = new Fuse(list, FUSE_OPTIONS);
    return search ? fuse.search(search) : list;
  };

  getPageWiseList = (items: Item[]): PageWiseList => {
    const {
      match: {
        params: { pageId },
      },
      pages,
    } = this.props;
    pages.sort((x, y) =>
      x.pageId === pageId ? -1 : y.pageId === pageId ? 1 : 0,
    );
    return pages.map((page) => {
      return {
        id: page.pageId,
        name: page.pageName,
        items: [...items.filter((item) => item.pageId === page.pageId)].sort(
          (a, b) => {
            const name1 = a.name.toLowerCase();
            const name2 = b.name.toLowerCase();
            if (name1 < name2) return -1;
            if (name1 > name2) return 1;
            return 0;
          },
        ),
      };
    });
  };

  handleCreateNew = (pageId: string) => {
    this.props.onItemCreateClick(pageId);
  };

  render() {
    const {
      createButtonTitle,
      isLoading,
      itemRender,
      location,
      selectedItemId,
    } = this.props;

    const { search } = this.state;
    const filteredList = this.getSearchFilteredList();
    const pageWiseList = this.getPageWiseList(filteredList);
    const destinationPageId = new URLSearchParams(location.search).get(
      "importTo",
    );

    return isLoading ? (
      <LoadingContainer>
        <Spinner size={30} />
      </LoadingContainer>
    ) : (
      <Wrapper>
        <ItemsWrapper>
          <Controls>
            <SearchBar
              icon="search"
              input={{
                value: search,
                onChange: this.handleSearchChange,
              }}
              placeholder="Search"
            />
          </Controls>
          <DragDropContext
            onDragEnd={this.onDragEnd}
            onDragStart={this.onDragStart}
          >
            <>
              {pageWiseList.map((page, i) => {
                return (
                  <PageContainer key={page.id}>
                    <PageName isMain={i === 0}>{page.name}</PageName>
                    <Droppable
                      droppableId={page.id}
                      isDropDisabled={page.id === this.state.itemDraggingFrom}
                      type="API"
                    >
                      {(provided, snapshot) => (
                        <PageDropContainer
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {provided.placeholder}
                          <div>
                            <StyledAddButton
                              className={
                                destinationPageId === page.id
                                  ? "highlightButton"
                                  : "createBtn"
                              }
                              fluid
                              icon="plus"
                              onClick={() => this.handleCreateNew(page.id)}
                              style={{ padding: "10px" }}
                              text={createButtonTitle}
                            />
                            {page.items.length === 0 && (
                              <NoItemMessage>
                                {"No APIs on this page yet"}
                              </NoItemMessage>
                            )}
                            {page.items.map((item: Item, index) => (
                              <Draggable
                                draggableId={item.id}
                                index={index}
                                key={item.id}
                              >
                                {(provided) => (
                                  <ItemContainer
                                    isBeingDragged={
                                      this.state.itemDragging === item.id
                                    }
                                    isDraggingOver={snapshot.isDraggingOver}
                                    isSelected={item.id === selectedItemId}
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() =>
                                      this.handleItemSelect(
                                        item.id,
                                        item.pageId,
                                      )
                                    }
                                  >
                                    {itemRender(item)}
                                    {this.state.itemDragging !== item.id && (
                                      <TreeDropdown
                                        defaultText=""
                                        onSelect={() => {
                                          return null;
                                        }}
                                        optionTree={[
                                          {
                                            value: "copy",
                                            onSelect: () => null,
                                            label: "Copy to",
                                            children: pageWiseList.map((p) => ({
                                              label: p.name,
                                              id: p.id,
                                              value: p.name,
                                              onSelect: () =>
                                                this.props.copyItem(
                                                  item.id,
                                                  p.id,
                                                ),
                                            })),
                                          },
                                          {
                                            value: "move",
                                            onSelect: () => null,
                                            label: "Move to",
                                            children: pageWiseList
                                              .filter((p) => p.id !== page.id)
                                              .map((p) => ({
                                                label: p.name,
                                                id: p.id,
                                                value: p.name,
                                                onSelect: () =>
                                                  this.props.moveItem(
                                                    item.id,
                                                    p.id,
                                                  ),
                                              })),
                                          },
                                          {
                                            value: "delete",
                                            onSelect: () =>
                                              this.props.deleteItem(
                                                item.id,
                                                item.name,
                                                page.name,
                                              ),
                                            label: "Delete",
                                            intent: "danger",
                                          },
                                        ]}
                                        selectedValue=""
                                        toggle={
                                          <ControlIcons.MORE_HORIZONTAL_CONTROL
                                            height={theme.fontSizes[4]}
                                            width={theme.fontSizes[4]}
                                          />
                                        }
                                      />
                                    )}
                                  </ItemContainer>
                                )}
                              </Draggable>
                            ))}
                          </div>
                        </PageDropContainer>
                      )}
                    </Droppable>
                  </PageContainer>
                );
              })}
            </>
          </DragDropContext>
        </ItemsWrapper>
      </Wrapper>
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  pages: state.entities.pageList.pages,
});

export default withRouter(connect(mapStateToProps)(EditorSidebar));
