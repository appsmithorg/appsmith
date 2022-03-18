import React from "react";
import { ProgressType, ProgressVariant } from "../constants";

function ProgressComponent(props: ProgressComponentProps) {
  return <div>{props.variant}</div>;
}

export interface ProgressComponentProps {
  type: ProgressType;
  variant: ProgressVariant;
  value: number;
  steps: number;
  showResult: boolean;
  counterClockwise: boolean;
  fillColor: string;
}

export default ProgressComponent;
