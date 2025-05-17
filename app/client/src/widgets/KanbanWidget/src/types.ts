export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  columnId: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
}

export interface KanbanWidgetProps {
  columns: KanbanColumn[];
  tasks: KanbanTask[];
  accentColor?: string;
  cardBg?: string;
  cardTextColor?: string;
  headerBg?: string;
  headerTextColor?: string;
  fontFamily?: string;
  fontSize?: string;
  borderRadius?: string;
  elevation?: number;
  onTaskAdd?: (task: KanbanTask) => void;
  onTaskMove?: (task: KanbanTask, fromColumn: string, toColumn: string) => void;
  onTaskDelete?: (task: KanbanTask) => void;
  onColumnAdd?: (column: KanbanColumn) => void;
  onColumnDelete?: (columnId: string) => void;
}
