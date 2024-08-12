import React from "react";
import type { SpinnerProps } from "@appsmith/ads";
import { Spinner } from "@appsmith/ads";

type Props = SpinnerProps;

function SpinnerLoader(props: Props) {
  return <Spinner size={props.size} />;
}

export default SpinnerLoader;
