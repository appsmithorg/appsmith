import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps, withRouter } from "react-router";
import styled from "styled-components";
import { AppState } from "reducers";
import { APIEditorRouteParams } from "constants/routes";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import { FormIcons } from "icons/FormIcons";
import { Spinner } from "@blueprintjs/core";
import { BaseTextInput } from "components/designSystems/appsmith/TextInputComponent";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import Fuse from "fuse.js";
import {
  DragDropContext,
  Draggable,
  DragStart,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import { PageListPayload } from "constants/ReduxActionConstants";
import ContextDropdown from "components/editorComponents/ContextDropdown";
import { theme } from "constants/DefaultTheme";

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
    color: ${props => props.theme.colors.textOnDarkBG}
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
  border-bottom: 1px solid #485158;
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
  border-color: ${props =>
    props.isMain ? props.theme.colors.primary : "transparent"};
`;

const PageDropContainer = styled.div`
  min-height: 32px;
  margin: 5px;
  background-color: ${props => props.theme.colors.paneBG};
`;

const ItemsWrapper = styled.div`
  flex: 1;
`;

const NoItemMessage = styled.span`
  color: #cacaca;
  padding-left: 12px;
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
  background-color: ${props =>
    props.isSelected || props.isBeingDragged
      ? props.theme.colors.paneCard
      : props.theme.colors.paneBG}
  :hover {
    background-color: ${props =>
      props.isDraggingOver
        ? props.theme.colors.paneBG
        : props.theme.colors.paneCard};
  }
`;

const DraftIconIndicator = styled.span<{ isHidden: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 8px;
  background-color: #f2994a;
  margin: 0 5px;
  opacity: ${({ isHidden }) => (isHidden ? 0 : 1)};
`;

const CreateNewButton = styled(BaseButton)`
  && {
    border: none;
    color: ${props => props.theme.colors.textOnDarkBG};
    height: 32px;
    text-align: left;
    justify-content: flex-start;
    &:hover {
      color: ${props => props.theme.colors.paneBG};
      svg {
        path {
          fill: ${props => props.theme.colors.paneBG};
        }
      }
    }
    svg {
      margin-top: 4px;
      height: 14px;
      width: 14px;
    }
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
  draftIds: string[];
  itemRender: (item: any) => JSX.Element;
  onItemCreateClick: () => void;
  onItemSelected: (itemId: string) => void;
  moveItem: (itemId: string, destinationPageId: string) => void;
  copyItem: (itemId: string, destinationPageId: string) => void;
  deleteItem: (itemId: string) => void;
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
  handleCreateNew = () => {
    this.props.onItemCreateClick();
  };

  handleSearchChange = (e: React.ChangeEvent<{ value: string }>) => {
    const value = e.target.value;
    this.setState({
      search: value,
    });
  };

  handleItemSelect = (itemId: string) => {
    this.props.onItemSelected(itemId);
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
    return pages.map(page => {
      return {
        id: page.pageId,
        name: page.pageName,
        items: [...items.filter(item => item.pageId === page.pageId)].sort(
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

  render() {
    const { isLoading, itemRender, selectedItemId, draftIds } = this.props;
    const { search } = this.state;
    const filteredList = this.getSearchFilteredList();
    const pageWiseList = this.getPageWiseList(filteredList);
    return (
      <React.Fragment>
        {isLoading ? (
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
                <CreateNewButton
                  text="Create new API"
                  icon={FormIcons.ADD_NEW_ICON()}
                  onClick={this.handleCreateNew}
                />
              </Controls>
              <DragDropContext
                onDragStart={this.onDragStart}
                onDragEnd={this.onDragEnd}
              >
                <React.Fragment>
                  {pageWiseList.map((page, i) => {
                    return (
                      <PageContainer key={page.id}>
                        <PageName isMain={i === 0}>{page.name}</PageName>
                        <Droppable
                          droppableId={page.id}
                          type="API"
                          isDropDisabled={
                            page.id === this.state.itemDraggingFrom
                          }
                        >
                          {(provided, snapshot) => (
                            <PageDropContainer
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                            >
                              {provided.placeholder}
                              <div>
                                {page.items.length === 0 && (
                                  <NoItemMessage>
                                    {"No item on this page yet"}
                                  </NoItemMessage>
                                )}
                                {page.items.map((item: Item, index) => (
                                  <Draggable
                                    key={item.id}
                                    draggableId={item.id}
                                    index={index}
                                  >
                                    {provided => (
                                      <ItemContainer
                                        isSelected={item.id === selectedItemId}
                                        isDraggingOver={snapshot.isDraggingOver}
                                        isBeingDragged={
                                          this.state.itemDragging === item.id
                                        }
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        onClick={() =>
                                          this.handleItemSelect(item.id)
                                        }
                                      >
                                        {itemRender(item)}
                                        {this.state.itemDragging !==
                                          item.id && (
                                          <React.Fragment>
                                            <DraftIconIndicator
                                              isHidden={
                                                draftIds.indexOf(item.id) === -1
                                              }
                                            />
                                            <ContextDropdown
                                              options={[
                                                {
                                                  value: "copy",
                                                  onSelect: () => null,
                                                  label: "Copy to",
                                                  children: pageWiseList.map(
                                                    p => ({
                                                      label: p.name,
                                                      id: p.id,
                                                      value: p.name,
                                                      onSelect: () =>
                                                        this.props.copyItem(
                                                          item.id,
                                                          p.id,
                                                        ),
                                                    }),
                                                  ),
                                                },
                                                {
                                                  value: "move",
                                                  onSelect: () => null,
                                                  label: "Move to",
                                                  children: pageWiseList
                                                    .filter(
                                                      p => p.id !== page.id,
                                                    )
                                                    .map(p => ({
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
                                                    ),
                                                  label: "Delete",
                                                  intent: "danger",
                                                },
                                              ]}
                                              toggle={{
                                                type: "icon",
                                                icon: "MORE_HORIZONTAL_CONTROL",
                                                iconSize: theme.fontSizes[4],
                                              }}
                                              className="more"
                                            />
                                          </React.Fragment>
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
                </React.Fragment>
              </DragDropContext>
            </ItemsWrapper>
          </Wrapper>
        )}
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  pages: state.entities.pageList.pages,
});

export default withRouter(connect(mapStateToProps)(EditorSidebar));
