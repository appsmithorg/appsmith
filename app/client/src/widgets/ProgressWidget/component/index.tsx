import React from "react";
import { ProgressVariantType } from "../constants";

function ProgressComponent(props: ProgressComponentProps) {
  return <div>{props.variant}</div>;
}

export interface ProgressComponentProps {
  variant: ProgressVariantType;
}

export default ProgressComponent;
