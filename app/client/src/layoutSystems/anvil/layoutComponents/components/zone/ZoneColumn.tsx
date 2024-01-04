import React, { useMemo } from "react";
import { FlexLayout, type FlexLayoutProps } from "../FlexLayout";
import { useZoneMinWidth } from "layoutSystems/anvil/canvasArenas/hooks/useZoneMinWidth";

export const ZoneColumn = (props: FlexLayoutProps) => {
  const minWidth: string = useZoneMinWidth();

  const flexProps = useMemo(() => ({ ...props, minWidth }), [props, minWidth]);

  return <FlexLayout {...flexProps}>{props.children}</FlexLayout>;
};
