import { CallFrame, integer } from "./chrome-devtools-types";

export interface PositionTickInfo {
  /**
   * Source line number (1-based).
   */
  line: integer;
  /**
   * Number of samples attributed to the source line.
   */
  ticks: integer;
}
export interface ProfilerProfileNode {
  /**
   * Unique id of the node.
   */
  id: integer;
  /**
   * Function location.
   */
  callFrame: CallFrame;
  /**
   * Number of samples where this node was on top of the call stack.
   */
  hitCount?: integer;
  /**
   * Child node ids.
   */
  children?: integer[];
  /**
   * The reason of being not optimized. The function may be deoptimized or marked as don't
   * optimize.
   */
  deoptReason?: string;
  /**
   * An array of source position ticks.
   */
  positionTicks?: PositionTickInfo[];
}
