import React from "react";
import { ControlWrapper } from "../../propertyControls/StyledControls";
import styled from "constants/DefaultTheme";
import { Droppable, Draggable } from "react-beautiful-dnd";

const StyledListWrapper = styled(ControlWrapper)`
  display: flex;
  justify-content: flex-start;
  padding-right: 16px;
  margin: 8px 0 0 0;
`;

type RenderComponentProps = {
  index: number;
  item: {
    label: string;
  };
  deleteOption: (index: number) => void;
  updateOption: (index: number, value: string) => void;
};

type DraggableComponentProps = {
  index: number;
  draggableId: string;
  item: {
    label: string;
  };
  deleteOption: (index: number) => void;
  updateOption: (index: number, value: string) => void;
  renderComponent: (props: RenderComponentProps) => JSX.Element;
};

export const DraggableComponent = (props: DraggableComponentProps) => {
  const {
    deleteOption,
    updateOption,
    item,
    index,
    draggableId,
    renderComponent,
  } = props;
  return (
    <Draggable draggableId={draggableId} key={draggableId} index={index}>
      {({ innerRef, draggableProps, dragHandleProps }) => (
        <StyledListWrapper
          orientation={"HORIZONTAL"}
          {...draggableProps}
          {...dragHandleProps}
          ref={innerRef as React.Ref<HTMLDivElement>}
          style={{
            ...draggableProps.style,
            userSelect: "none",
            position: "static",
          }}
        >
          {renderComponent({ deleteOption, updateOption, item, index })}
        </StyledListWrapper>
      )}
    </Draggable>
  );
};

type DroppableComponentProps = {
  items: object[];
  renderComponent: (props: RenderComponentProps) => JSX.Element;
  deleteOption: (index: number) => void;
  updateOption: (index: number, value: string) => void;
};

export const DroppableComponent = (props: DroppableComponentProps) => {
  const { items } = props;
  return (
    <Droppable droppableId="0">
      {({ innerRef, droppableProps, placeholder }) => (
        <div ref={innerRef as React.Ref<HTMLDivElement>} {...droppableProps}>
          {items.map((item: { id: string } & any, index: number) => {
            return (
              <DraggableComponent
                key={index}
                index={index}
                item={item}
                draggableId={item.id}
                {...props}
              />
            );
          })}
        </div>
      )}
    </Droppable>
  );
};
