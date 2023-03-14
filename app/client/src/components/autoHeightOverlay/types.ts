export interface onDragCallbacksProps {
  onStart: () => void;
  onStop: () => void;
  onUpdate: (x: number, y: number) => void;
}

export interface onMouseHoverCallbacksProps {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}
