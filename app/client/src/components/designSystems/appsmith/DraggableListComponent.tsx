import React from "react";
import styled from "constants/DefaultTheme";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
const ItemWrapper = styled.div`
  padding-right: 0;
  margin: 8px 0 0 0;
`;

const DroppableWrapper = styled.div`
  width: 250px;
`;

type RenderComponentProps = {
  index: number;
  item: {
    label: string;
    isDerived?: boolean;
  };
  deleteOption: (index: number) => void;
  updateCurrentFocusedInput: (index: number | null) => void;
  updateOption: (index: number, value: string) => void;
  toggleVisibility?: (index: number) => void;
  onEdit?: (index: number) => void;
};

interface DroppableComponentProps {
  items: Array<Record<string, unknown>>;
  renderComponent: (props: RenderComponentProps) => JSX.Element;
  deleteOption: (index: number) => void;
  updateCurrentFocusedInput: (index: number | null) => void;
  updateOption: (index: number, value: string) => void;
  toggleVisibility?: (index: number) => void;
  updateItems: (items: Array<Record<string, unknown>>) => void;
  onEdit?: (index: number) => void;
}

interface DroppableComponentState {
  items: Array<Record<string, unknown>>;
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
    const items: Array<Record<string, unknown>> = [...this.state.items];
    const sourceIndex = source.index;
    let destinationIndex;
    if (!destination) {
      destinationIndex = items.length;
    } else {
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }
      destinationIndex = destination.index;
    }
    items.splice(destinationIndex, 0, items[sourceIndex]);
    items.splice(sourceIndex + (destinationIndex < sourceIndex ? 1 : 0), 1);
    this.setState({ items: items });
    this.props.updateItems(items);
  };

  render() {
    const {
      deleteOption,
      onEdit,
      renderComponent,
      toggleVisibility,
      updateCurrentFocusedInput,
      updateOption,
    } = this.props;
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId="droppable">
          {({ droppableProps, innerRef, placeholder }) => (
            <DroppableWrapper
              ref={innerRef as React.Ref<HTMLDivElement>}
              {...droppableProps}
            >
              {this.state.items.map(
                (item: { id: string } & any, index: number) => {
                  return (
                    <Draggable
                      draggableId={item.id}
                      index={index}
                      key={item.id}
                    >
                      {({ draggableProps, dragHandleProps, innerRef }) => (
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
                            updateCurrentFocusedInput,
                            updateOption,
                            toggleVisibility,
                            onEdit,
                            item,
                            index,
                          })}
                        </ItemWrapper>
                      )}
                    </Draggable>
                  );
                },
              )}
              {placeholder}
            </DroppableWrapper>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}
