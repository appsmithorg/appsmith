export interface FixedCanvasDraggingArenaProps {
  canExtend: boolean;
  detachFromLayout?: boolean;
  dropDisabled?: boolean;
  noPad?: boolean;
  snapColumnSpace: number;
  snapRows: number;
  snapRowSpace: number;
  parentId?: string;
  widgetId: string;
  widgetName?: string;
}
