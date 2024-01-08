import React, { useContext, useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import CustomComponent from "widgets/CustomWidget/component";
import { CustomWidgetBuilderContext } from "../index";
import { toast } from "design-system";
import Debugger from "./Debugger";
import {
  CUSTOM_WIDGET_FEATURE,
  createMessage,
} from "@appsmith/constants/messages";
import type { AppThemeProperties } from "entities/AppTheming";

export default function Preview() {
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

  return (
    <div className={styles.contentLeft} ref={containerRef}>
      <CustomComponent
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
