import React, { useState } from "react";
import styled from "styled-components";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import type { KanbanColumn, KanbanTask, KanbanWidgetProps } from "./types";

const Board = styled.div<{ fontFamily?: string; fontSize?: string }>`
  display: flex;
  gap: 16px;
  font-family: ${(p) => p.fontFamily || "inherit"};
  font-size: ${(p) => p.fontSize || "14px"};
`;

const Column = styled.div<{ headerBg?: string; headerTextColor?: string }>`
  background: ${(p) => p.headerBg || "#f0f0f0"};
  padding: 8px;
  border-radius: 4px;
  flex: 1;
  display: flex;
  flex-direction: column;
  max-height: 100%;
`;

const ColumnHeader = styled.div<{ headerBg?: string; headerTextColor?: string }>`
  background: ${(p) => p.headerBg || "#eee"};
  color: ${(p) => p.headerTextColor || "#000"};
  padding: 8px;
  border-radius: 4px;
  font-weight: bold;
`;

const Tasks = styled.div`
  flex: 1;
  min-height: 20px;
`;

const TaskCard = styled.div<{ cardBg?: string; cardTextColor?: string; borderRadius?: string; elevation?: number }>`
  background: ${(p) => p.cardBg || "#fff"};
  color: ${(p) => p.cardTextColor || "#000"};
  border-radius: ${(p) => p.borderRadius || "4px"};
  box-shadow: ${(p) => (p.elevation ? `0 ${p.elevation}px ${p.elevation * 2}px rgba(0,0,0,0.1)` : "none")};
  padding: 8px;
  margin-bottom: 8px;
`;

export const KanbanWidget = (props: KanbanWidgetProps) => {
  const [tasks, setTasks] = useState<KanbanTask[]>(props.tasks);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const sourceCol = result.source.droppableId;
    const destCol = result.destination.droppableId;

    if (sourceCol === destCol && result.source.index === result.destination.index) {
      return;
    }

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updated: KanbanTask[] = tasks.map((t) =>
      t.id === taskId ? { ...t, columnId: destCol } : t,
    );
    setTasks(updated);
    props.onTaskMove && props.onTaskMove(task, sourceCol, destCol);
  };

  const handleAddTask = (columnId: string) => {
    const title = prompt("Task title")?.trim();
    if (!title) return;
    const newTask: KanbanTask = { id: Date.now().toString(), title, columnId };
    setTasks([...tasks, newTask]);
    props.onTaskAdd && props.onTaskAdd(newTask);
  };

  const handleDeleteTask = (task: KanbanTask) => {
    setTasks(tasks.filter((t) => t.id !== task.id));
    props.onTaskDelete && props.onTaskDelete(task);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Board fontFamily={props.fontFamily} fontSize={props.fontSize}>
        {props.columns.map((column) => (
          <Droppable droppableId={column.id} key={column.id}>
            {(provided) => (
              <Column
                ref={provided.innerRef}
                {...provided.droppableProps}
                headerBg={props.headerBg}
                headerTextColor={props.headerTextColor}
              >
                <ColumnHeader headerBg={props.headerBg} headerTextColor={props.headerTextColor}>
                  {column.title}
                </ColumnHeader>
                <Tasks>
                  {tasks
                    .filter((t) => t.columnId === column.id)
                    .map((task, index) => (
                      <Draggable draggableId={task.id} index={index} key={task.id}>
                        {(dragProvided) => (
                          <TaskCard
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            cardBg={props.cardBg}
                            cardTextColor={props.cardTextColor}
                            borderRadius={props.borderRadius}
                            elevation={props.elevation}
                          >
                            {task.title}
                            <button style={{ float: "right" }} onClick={() => handleDeleteTask(task)}>
                              ✕
                            </button>
                          </TaskCard>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </Tasks>
                <button onClick={() => handleAddTask(column.id)}>+ Add Task</button>
              </Column>
            )}
          </Droppable>
        ))}
      </Board>
    </DragDropContext>
  );
};

export default KanbanWidget;
