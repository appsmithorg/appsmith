import React, { cloneElement } from "react";
import type { ReactElement } from "react";

import { animated, useSpring } from "@react-spring/web";

import { usePrevious } from "./hooks";
import { DEFAULT_ROWS, SPRING_ANIMATION_CONFIG } from "./constants";
import type { LayoutAreaProps } from "./components";

import {
  resolveAreasVisibility,
  type ResolveAreasVisibilityProps,
} from "./utils";

type GridProps = Omit<ResolveAreasVisibilityProps, "rows"> &
  Partial<Pick<ResolveAreasVisibilityProps, "rows">>;

interface GridLayoutProps extends GridProps {
  height?: string;
  width?: string;
  children: Array<ReactElement<LayoutAreaProps>>;
}

export function AnimatedGridLayout(props: GridLayoutProps) {
  const {
    areas,
    children,
    columns,
    height,
    rows = DEFAULT_ROWS,
    width,
  } = props;

  const gridTemplateAreas = areas
    .map((area) => `"${area.join(" ")}"`)
    .join("\n");

  const gridTemplateRows = rows.join(" ");
  const prevGridTemplateRows = usePrevious(gridTemplateRows);
  const animatedGridTemplateRows = useSpring({
    config: SPRING_ANIMATION_CONFIG,
    from: { gridTemplateRows: prevGridTemplateRows },
    to: { gridTemplateRows },
  });

  const gridTemplateColumns = columns.join(" ");
  const prevGridTemplateColumns = usePrevious(gridTemplateColumns);
  const animatedGridTemplateColumns = useSpring({
    config: SPRING_ANIMATION_CONFIG,
    from: { girdTemplateColumns: prevGridTemplateColumns },
    to: { gridTemplateColumns },
  });

  const visibility = resolveAreasVisibility({ rows, columns, areas });

  const components = React.Children.map(children, (child) => {
    const { name: areaName } = child.props;
    return cloneElement(child, { hidden: !visibility[areaName] });
  });

  return (
    <animated.div
      style={{
        display: "grid",
        gridTemplateAreas,
        width: width ?? "auto",
        height: height ?? "auto",
        gap: 0,
        willChange: "auto",
        ...animatedGridTemplateRows,
        ...animatedGridTemplateColumns,
      }}
    >
      {components}
    </animated.div>
  );
}
