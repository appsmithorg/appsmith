import React, { useContext, useEffect, useRef, useState } from "react";
import CustomComponent from "widgets/CustomWidget/component";
import { CustomWidgetBuilderContext } from "../index";
import { toast } from "@appsmith/ads";
import Debugger from "./Debugger";
import { CUSTOM_WIDGET_FEATURE, createMessage } from "ee/constants/messages";
import type { AppThemeProperties } from "entities/AppTheming";
import { DynamicHeight } from "utils/WidgetFeatures";

export default function Preview({ width }: { width: number }) {
  const {
    key,
    model,
    srcDoc,
    theme,
    updateDebuggerLogs,
    updateModel,
    widgetId,
  } = useContext(CustomWidgetBuilderContext);

  const [dimensions, setDimensions] = useState({
    width: 300,
    height: 500,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current?.clientWidth + 8,
        height:
          window.innerHeight -
          containerRef.current.getBoundingClientRect().top -
          31,
      });
    }

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current?.clientWidth + 8,
          height:
            window.innerHeight -
            containerRef.current.getBoundingClientRect().top -
            31,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth + 8,
        height:
          window.innerHeight -
          containerRef.current.getBoundingClientRect().top -
          31,
      });
    }
  }, [width, containerRef.current?.clientWidth]);

  return (
    <div ref={containerRef}>
      <CustomComponent
        dynamicHeight={DynamicHeight.FIXED}
        execute={(name, contextObject) => {
          toast.show(
            `${createMessage(
              CUSTOM_WIDGET_FEATURE.preview.eventFired,
            )} ${name}`,
            { kind: "success" },
          );

          updateDebuggerLogs?.({
            type: "info",
            args: [
              {
                message: `${createMessage(
                  CUSTOM_WIDGET_FEATURE.preview.eventFired,
                )} '${name}'`,
              },
              { message: contextObject },
            ],
          });
        }}
        height={dimensions.height}
        key={key}
        minDynamicHeight={0}
        model={model || {}}
        onConsole={(type, args) => {
          updateDebuggerLogs?.({
            type,
            args,
          });
        }}
        renderMode="BUILDER"
        srcDoc={srcDoc || { html: "", js: "", css: "" }}
        theme={theme as AppThemeProperties}
        update={(data) => {
          updateModel?.(data);

          const message = createMessage(
            CUSTOM_WIDGET_FEATURE.preview.modelUpdated,
          );

          toast.show(message, { kind: "success" });

          updateDebuggerLogs?.({
            type: "info",
            args: [{ message }, { message: data }],
          });
        }}
        widgetId={widgetId || ""}
        width={dimensions.width}
      />
      <Debugger />
    </div>
  );
}
