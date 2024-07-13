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
      onRender={(...args) => {
        const [, phase, actualDuaration, baseDuration] = args;
        generateRootSpan("widgetRender", actualDuaration, {
          widgetType: type,
          widgetId,
          phase,
          baseDuration,
        });
      }}
    >
      {children}
    </Profiler>
  );
};
