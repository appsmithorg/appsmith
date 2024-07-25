import React, { Profiler } from "react";
import { generateRootSpan } from "UITelemetry/generateTraces";
export const WidgetProfiler = ({
  children,
  type,
  widgetId,
}: {
  children: React.ReactNode;
  type: string;
  widgetId: string;
}) => {
  return (
    <Profiler
      id={widgetId}
      onRender={(id, phase, actualDuaration, baseDuration) => {
        generateRootSpan("widgetRender", actualDuaration, {
          widgetType: type,
          id,
          // mount or update phase
          phase,
          // estimated time to render the entire subtree without memoization
          baseDuration,
        });
      }}
    >
      {children}
    </Profiler>
  );
};
