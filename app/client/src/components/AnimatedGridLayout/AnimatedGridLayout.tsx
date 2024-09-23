import React, { cloneElement, useLayoutEffect, type ReactElement } from "react";

import { animated, useSpring } from "@react-spring/web";
import debounce from "lodash/debounce";

import { usePrevious } from "./hooks";
import { DEFAULT_ROWS, SPRING_ANIMATION_CONFIG } from "./constants";
import type { LayoutAreaProps } from "./components";

import {
  resolveAreasVisibility,
  resolvePixelValues,
  resolveAreaDimensions,
} from "./utils";

import type { AnimatedGridUnit } from "./types";

interface AnimatedGridLayoutProps {
  /** The height of the grid layout. */
  height?: string;
  /** The width of the grid layout. */
  width?: string;
  /** Used for CSS grid-template-rows, limited to px & fr. */
  rows?: AnimatedGridUnit[];
  /** Used for CSS grid-template-columns, limited to px & fr. */
  columns: AnimatedGridUnit[];
  /** Used for CSS grid-template-areas. */
  areas: string[][];
  /** Layout areas that get attached to gird, must be LayoutArea components. */
  children: Array<ReactElement<LayoutAreaProps>>;
}

const pixelValuesToGridTemplate = (pixelValues: number[]) =>
  pixelValues.map((value) => `${value}px`).join(" ");

export function AnimatedGridLayout(props: AnimatedGridLayoutProps) {
  const {
    areas,
    children,
    columns,
    height,
    rows = DEFAULT_ROWS,
    width,
  } = props;

  const [clientWidth, setClientWidth] = React.useState(0);
  const [clientHeight, setClientHeight] = React.useState(0);

  const gridTemplateAreas = areas
    .map((area) => `"${area.join(" ")}"`)
    .join("\n");

  const currentRows = resolvePixelValues(clientHeight, rows);
  const previousRows = usePrevious(currentRows);

  const gridTemplateRows = pixelValuesToGridTemplate(currentRows);
  const prevGridTemplateRows = pixelValuesToGridTemplate(previousRows);

  const animatedGridTemplateRows = useSpring({
    config: SPRING_ANIMATION_CONFIG,
    from: { gridTemplateRows: prevGridTemplateRows },
    to: { gridTemplateRows },
  });

  const currentColumns = resolvePixelValues(clientWidth, columns);
  const previousColumns = usePrevious(currentColumns);

  const gridTemplateColumns = pixelValuesToGridTemplate(currentColumns);
  const prevGridTemplateColumns = pixelValuesToGridTemplate(previousColumns);

  const animatedGridTemplateColumns = useSpring({
    config: SPRING_ANIMATION_CONFIG,
    from: { girdTemplateColumns: prevGridTemplateColumns },
    to: { gridTemplateColumns },
  });

  const areasDimensions = resolveAreaDimensions({
    rows: currentRows,
    columns: currentColumns,
    areas,
  });

  const previousAreasDimensions = usePrevious(areasDimensions);

  const areaVisibility = resolveAreasVisibility({ rows, columns, areas });

  const components = React.Children.map(children, (child) => {
    const { name: areaName } = child.props;
    const isAreaHidden = !areaVisibility[areaName];

    return cloneElement(child, {
      hidden: isAreaHidden,
      dimensions: isAreaHidden
        ? previousAreasDimensions[areaName]
        : areasDimensions[areaName],
    });
  });

  const ref = React.useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const containerElement = ref.current;

    if (containerElement) {
      setClientHeight(containerElement.clientHeight);
      setClientWidth(containerElement.clientWidth);

      const handleResize = debounce(() => {
        setClientHeight(containerElement.clientHeight);
        setClientWidth(containerElement.clientWidth);
      }, 100);

      const resizeObserver = new ResizeObserver(handleResize);

      resizeObserver.observe(containerElement);

      return () => {
        resizeObserver.unobserve(containerElement);
      };
    }
  }, [areas, columns, rows]);

  return (
    <animated.div
      ref={ref}
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
