import React, { Profiler, useCallback } from "react";
import { startAndEndSpan } from "instrumentation/generateTraces";

export const WidgetProfiler = ({
  children,
  type,
  widgetId,
}: {
  children: React.ReactNode;
  type: string;
  widgetId: string;
}) => {
  const onRender = useCallback(
    (id: string, phase: string, actualDuration: number) => {
      startAndEndSpan("widgetRender", Date.now(), actualDuration, {
        widgetType: type,
        // mount or update phase
        phase,
      });
    },
    [type],
  );

  return (
    <Profiler id={widgetId} onRender={onRender}>
      {children}
    </Profiler>
  );
};
