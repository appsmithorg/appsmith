export interface MainCanvasReduxState {
  initialized: boolean;
  width: number;
  height: number;
  isPreviewMode: boolean;
  mainCanvasProps: {
    width: number;
    height: number;
    parentRowSpace: number;
    parentColumnSpace: number;
    minHeight: number;
  };
}
