import React from "react";
import type { SpinnerProps } from "design-system";
import { Spinner } from "design-system";

type Props = SpinnerProps;

function SpinnerLoader(props: Props) {
  return <Spinner size={props.size} />;
}

export default SpinnerLoader;
