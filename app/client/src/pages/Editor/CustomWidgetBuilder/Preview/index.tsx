import React, { useContext, useEffect, useRef, useState } from "react";
import FixedLayoutCustomComponent from "widgets/CustomWidget/component";
import { CustomWidgetComponent as AnvilLayoutCustomComponent } from "modules/ui-builder/ui/wds/WDSCustomWidget/component";
import { CustomWidgetBuilderContext } from "../index";
import { toast } from "@appsmith/ads";
import Debugger from "./Debugger";
import { CUSTOM_WIDGET_FEATURE, createMessage } from "ee/constants/messages";
import type { AppThemeProperties } from "entities/AppTheming";
import { DynamicHeight } from "utils/WidgetFeatures";
import { getIsAnvilLayout } from "layoutSystems/anvil/integrations/selectors";
import { useSelector } from "react-redux";
import { ThemeProvider, useTheme } from "@appsmith/wds-theming";
import { getAppThemeSettings } from "ee/selectors/applicationSelectors";

import styles from "./styles.module.css";

export default function Preview({
  className,
  width,
}: {
  className?: string;
  width: number;
}) {
  const {
    key,
    model,
    srcDoc,
    theme,
    updateDebuggerLogs,
    updateModel,
    widgetId,
  } = useContext(CustomWidgetBuilderContext);
  const isAnvilLayout = useSelector(getIsAnvilLayout);
  const themeSetting = useSelector(getAppThemeSettings);
  const wdsThemeProps = {
    borderRadius: themeSetting.borderRadius,
    seedColor: themeSetting.accentColor,
    colorMode: themeSetting.colorMode.toLowerCase(),
    userSizing: themeSetting.sizing,
    userDensity: themeSetting.density,
  } as Parameters<typeof useTheme>[0];
  const { theme: anvilTheme } = useTheme(isAnvilLayout ? wdsThemeProps : {});

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

  const execute = (name: string, contextObject: unknown) => {
    toast.show(
      `${createMessage(CUSTOM_WIDGET_FEATURE.preview.eventFired)} ${name}`,
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
  };

  const update = (data: Record<string, unknown>) => {
    updateModel?.(data);

    const message = createMessage(CUSTOM_WIDGET_FEATURE.preview.modelUpdated);

    toast.show(message, { kind: "success" });

    updateDebuggerLogs?.({
      type: "info",
      args: [{ message }, { message: data }],
    });
  };

  const customComponent = () => {
    if (isAnvilLayout) {
      return (
        <ThemeProvider className={styles.themeProvider} theme={anvilTheme}>
          <AnvilLayoutCustomComponent
            model={model || {}}
            onTriggerEvent={execute}
            onUpdateModel={update}
            renderMode="BUILDER"
            srcDoc={srcDoc || { html: "", js: "", css: "" }}
            widgetId={widgetId || ""}
          />
        </ThemeProvider>
      );
    }

    return (
      <FixedLayoutCustomComponent
        dynamicHeight={DynamicHeight.FIXED}
        execute={execute}
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
        update={update}
        widgetId={widgetId || ""}
        width={dimensions.width}
      />
    );
  };

  return (
    <div className={className} ref={containerRef} style={{ height: "100%" }}>
      {customComponent()}
      <Debugger />
    </div>
  );
}
