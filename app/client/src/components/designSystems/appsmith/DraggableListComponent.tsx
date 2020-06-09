import React from "react";
import styled from "constants/DefaultTheme";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const ItemWrapper = styled.div`
  padding-right: 16px;
  margin: 8px 0 0 0;
`;

const DroppableWrapper = styled.div`
  width: 250px;
`;

type RenderComponentProps = {
  index: number;
  item: {
    label: string;
  };
  deleteOption: (index: number) => void;
  updateOption: (index: number, value: string) => void;
};

interface DroppableComponentProps {
  items: object[];
  renderComponent: (props: RenderComponentProps) => JSX.Element;
  deleteOption: (index: number) => void;
  updateOption: (index: number, value: string) => void;
  updateItems: (items: object[]) => void;
}

interface DroppableComponentState {
  items: object[];
}

export class DroppableComponent extends React.Component<
  DroppableComponentProps,
  DroppableComponentState
> {
  constructor(props: DroppableComponentProps) {
    super(props);
    this.state = {
      items: props.items,
    };
  }

  componentDidUpdate(prevProps: DroppableComponentProps) {
    if (this.props.items.length !== prevProps.items.length) {
      this.setState({ items: this.props.items });
    } else if (
      JSON.stringify(this.props.items) !== JSON.stringify(prevProps.items)
    ) {
      this.setState({ items: this.props.items });
    }
  }

  onDragEnd = (result: any) => {
    const { destination, source } = result;
    if (!destination) {
      return;
    }
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    const tabs: object[] = this.state.items;
    const sourceTab = tabs[source.index];
    const destinationTab = tabs[destination.index];
    const updatedTabs = tabs.map((tab, index) => {
      if (index === source.index) {
        return destinationTab;
      } else if (index === destination.index) {
        return sourceTab;
      }
      return tab;
    });
    this.setState({ items: updatedTabs });
    this.props.updateItems(updatedTabs);
  };

  render() {
    const { renderComponent, deleteOption, updateOption } = this.props;
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId="droppable">
          {({ innerRef, droppableProps, placeholder }) => (
            <DroppableWrapper
              ref={innerRef as React.Ref<HTMLDivElement>}
              {...droppableProps}
            >
              {this.state.items.map(
                (item: { id: string } & any, index: number) => {
                  return (
                    <Draggable
                      draggableId={item.id}
                      key={item.id}
                      index={index}
                    >
                      {({ innerRef, draggableProps, dragHandleProps }) => (
                        <ItemWrapper
                          ref={innerRef as React.Ref<HTMLDivElement>}
                          {...draggableProps}
                          {...dragHandleProps}
                          style={{
                            ...draggableProps.style,
                            userSelect: "none",
                            position: "static",
                          }}
                        >
                          {renderComponent({
                            deleteOption,
                            updateOption,
                            item,
                            index,
                          })}
                        </ItemWrapper>
                      )}
                    </Draggable>
                  );
                },
              )}
            </DroppableWrapper>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}
