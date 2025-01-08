import React from "react";
import styled from "styled-components";
import type {
  DropResult,
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot,
} from "react-beautiful-dnd";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

export interface KanbanTask {
  title: string;
  description: string;
  style?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

export interface KanbanColumn {
  title: string;
  tasks: KanbanTask[];
  style?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

interface KanbanComponentProps {
  columns: KanbanColumn[];
  backgroundColor?: string;
  borderRadius?: string;
  boxShadow?: string;
  onTaskMove?: (columns: KanbanColumn[]) => void;
}

const Container = styled.div<{
  backgroundColor?: string;
  borderRadius?: string;
  boxShadow?: string;
}>`
  display: flex;
  height: 100%;
  background-color: ${(props) =>
    props.backgroundColor || "var(--appsmith-color-black-0)"};
  border-radius: ${(props) =>
    props.borderRadius || "var(--appsmith-border-radius-1)"};
  box-shadow: ${(props) => props.boxShadow || "none"};
  padding: var(--appsmith-spaces-4);
  gap: var(--appsmith-spaces-4);
  overflow-x: auto;
  font-family: var(--appsmith-font-family);
`;

const Column = styled.div<{
  backgroundColor?: string;
  textColor?: string;
}>`
  background-color: ${(props) =>
    props.backgroundColor || "var(--appsmith-color-black-50)"};
  border-radius: var(--appsmith-border-radius-1);
  width: 280px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  padding: var(--appsmith-spaces-4);
`;

const ColumnTitle = styled.h3`
  margin: 0;
  padding: var(--appsmith-spaces-4);
  font-size: var(--appsmith-font-size-4);
  font-weight: var(--appsmith-font-weight-5);
  color: ${(props) => props.color || "var(--appsmith-color-black-900)"};
`;

const TaskList = styled.div`
  padding: var(--appsmith-spaces-4);
  flex-grow: 1;
  min-height: 100px;
  transition: background-color 0.2s ease;

  &.dragging-over {
    background-color: var(--appsmith-color-black-100);
    border-radius: var(--appsmith-border-radius-1);
  }
`;

const Task = styled.div<{
  backgroundColor?: string;
  textColor?: string;
}>`
  background-color: ${(props) =>
    props.backgroundColor || "var(--appsmith-color-black-0)"};
  color: ${(props) => props.textColor || "var(--appsmith-color-black-800)"};
  border-radius: var(--appsmith-border-radius-1);
  padding: var(--appsmith-spaces-4);
  margin-bottom: var(--appsmith-spaces-3);
  box-shadow: var(--appsmith-card-shadow);
  cursor: grab;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--appsmith-card-shadow-hover);
  }

  &:active {
    cursor: grabbing;
  }
`;

const TaskTitle = styled.div`
  font-weight: var(--appsmith-font-weight-5);
  margin-bottom: var(--appsmith-spaces-2);
  color: inherit;
`;

const TaskDescription = styled.div`
  font-size: var(--appsmith-font-size-3);
  color: inherit;
  opacity: 0.8;
`;

const KanbanComponent: React.FC<KanbanComponentProps> = React.memo(
  ({
    backgroundColor,
    borderRadius,
    boxShadow,
    columns,
    onTaskMove,
  }: KanbanComponentProps) => {
    const onDragEnd = React.useCallback(
      (result: DropResult): void => {
        const { destination, source } = result;

        if (!destination) return;

        if (
          destination.droppableId === source.droppableId &&
          destination.index === source.index
        ) {
          return;
        }

        const sourceColumnIndex = parseInt(source.droppableId.split("-")[1]);
        const destColumnIndex = parseInt(destination.droppableId.split("-")[1]);

        const newColumns = [...columns];
        const sourceColumn = newColumns[sourceColumnIndex];
        const destColumn = newColumns[destColumnIndex];

        const [movedTask] = sourceColumn.tasks.splice(source.index, 1);

        destColumn.tasks.splice(destination.index, 0, movedTask);

        // Trigger widget property update
        if (onTaskMove) {
          onTaskMove(newColumns);
        }
      },
      [columns, onTaskMove],
    );

    return (
      <Container
        backgroundColor={backgroundColor}
        borderRadius={borderRadius}
        boxShadow={boxShadow}
      >
        <DragDropContext onDragEnd={onDragEnd}>
          {columns.map((column, columnIndex) => (
            <Column
              backgroundColor={column.style?.backgroundColor ?? undefined}
              key={columnIndex}
              textColor={column.style?.textColor ?? undefined}
            >
              <ColumnTitle color={column.style?.textColor ?? undefined}>
                {column.title}
              </ColumnTitle>
              <Droppable droppableId={`column-${columnIndex}`}>
                {(
                  provided: DroppableProvided,
                  snapshot: DroppableStateSnapshot,
                ) => (
                  <TaskList
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={snapshot.isDraggingOver ? "dragging-over" : ""}
                    data-testid="t--kanban-tasklist"
                  >
                    {column.tasks.map((task, taskIndex) => (
                      <Draggable
                        draggableId={`task-${columnIndex}-${taskIndex}`}
                        index={taskIndex}
                        key={taskIndex}
                      >
                        {(
                          provided: DraggableProvided,
                          snapshot: DraggableStateSnapshot,
                        ) => (
                          <Task
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            backgroundColor={
                              task.style?.backgroundColor ?? undefined
                            }
                            data-testid="t--kanban-task"
                            style={React.useMemo(
                              () => ({
                                ...provided.draggableProps.style,
                                transform: snapshot.isDragging && provided.draggableProps.style
                                  ? provided.draggableProps.style.transform ?? "none"
                                  : "none",
                                backgroundColor: task.style?.backgroundColor,
                                color: task.style?.textColor,
                              }),
                              [
                                provided.draggableProps.style,
                                snapshot.isDragging,
                                task.style,
                              ],
                            )}
                            textColor={task.style?.textColor ?? undefined}
                          >
                            <TaskTitle>{task.title}</TaskTitle>
                            <TaskDescription>
                              {task.description}
                            </TaskDescription>
                          </Task>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </TaskList>
                )}
              </Droppable>
            </Column>
          ))}
        </DragDropContext>
      </Container>
    );
  },
);

export default KanbanComponent;
