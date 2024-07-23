import React, { Profiler, useEffect } from "react";

import { metrics } from "@opentelemetry/api";

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
        const meter = metrics.getMeter("render");
        const widgetRenderMeter = meter.createHistogram("widgetRender", {
          description: "LatencyHttp",
          unit: "ms",
        });
        const [, phase, actualDuaration, baseDuration] = args;
        console.log("*** see render", args);
        widgetRenderMeter.record(actualDuaration);
      }}
    >
      {children}
    </Profiler>
  );
};
