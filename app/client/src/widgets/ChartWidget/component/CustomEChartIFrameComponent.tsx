import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import type { ChartComponentConnectedProps } from ".";
import { chartOptions, dataClickCallbackHelper } from "./helpers";
import { ChartErrorComponent } from "./ChartErrorComponent";
import usePrevious from "utils/hooks/usePrevious";
import equal from "fast-deep-equal/es6";

import type * as echarts from "echarts";
import type {
  CustomEChartClickEventData,
  CustomEChartErrorData,
  CustomEChartIFrameMessage,
  CustomEChartIFrameMessageData,
} from "../constants";

export const IframeContainer = styled.iframe`
  position: relative;
  height: 100%;
  width: 100%;
`;

const OverlayDiv = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

/**
 * TODO : Rajat to move src doc function into typescript file
 *  and a webpack plugin to convert it into srcdoc
 */
export function CustomEChartIFrameComponent(
  props: ChartComponentConnectedProps,
) {
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);
  const [errorStack, setErrorStack] = useState<string | undefined>(undefined);
  const prevProps = usePrevious(props);
  const iFrameRef = useRef<HTMLIFrameElement>(null);

  const postMessageFn = (data: CustomEChartIFrameMessageData) => {
    const iFrameWindow = iFrameRef.current?.contentWindow;
    iFrameWindow?.postMessage(data, "*");
  };

  const onMessage = (event: MessageEvent) => {
    const iFrameWindow = iFrameRef.current?.contentWindow;

    if (!iFrameWindow || event.source != iFrameWindow) {
      return;
    }

    const message: CustomEChartIFrameMessage = event.data;
    switch (message.type) {
      case "click-event": {
        const messageData: CustomEChartClickEventData =
          message.data as CustomEChartClickEventData;
        dataClickCallbackHelper(messageData.event, props, "CUSTOM_ECHART");
        break;
      }
      case "load-complete": {
        postMessageFn({
          options: chartOptions("CUSTOM_ECHART", props),
          shouldUpdateOptions: true,
          shouldResize: false,
          width: props.dimensions.componentWidth,
          height: props.dimensions.componentHeight,
        });
        break;
      }
      case "error": {
        const errorMessage: CustomEChartErrorData =
          message.data as CustomEChartErrorData;
        setErrorMsg(errorMessage.message);
        setErrorStack(errorMessage.stack);
        break;
      }
      default: {
        return;
      }
    }
  };

  function shouldResizeECharts(
    echartsInstance: echarts.ECharts,
    width: number,
    height: number,
  ) {
    const chartHeight = echartsInstance?.getHeight();
    const chartWidth = echartsInstance?.getWidth();

    return chartHeight != height || chartWidth != width;
  }

  function onMessageCallback(
    e: MessageEvent,
    echartsInstance: echarts.ECharts,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _: any,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    echarts: any,
  ) {
    const config: CustomEChartIFrameMessageData = e.data;

    if (!config || !config.hasOwnProperty("options")) {
      return;
    }

    const newOptions = parseConfigurationForCallbackFns(config.options, _);

    try {
      if (!echartsInstance || echartsInstance.isDisposed()) {
        echartsInstance = initializeECharts(echarts);
      }

      if (config.shouldUpdateOptions) {
        echartsInstance.setOption(newOptions, true);
      }

      if (
        config.shouldResize &&
        shouldResizeECharts(echartsInstance, config.width, config.height)
      ) {
        echartsInstance.resize({ width: config.width, height: config.height });
      }
    } catch (error) {
      echartsInstance.dispose();

      const data: CustomEChartErrorData = {
        message: (error as Error).message,
        stack: (error as Error).stack || "",
      };

      const message: CustomEChartIFrameMessage = {
        type: "error",
        data: data,
      };

      parent.postMessage(message, "*");
    }

    echartsInstance.off("click");

    echartsInstance.on("click", (event: echarts.ECElementEvent) => {
      const data: CustomEChartClickEventData = {
        event: _.omit(_.cloneDeep(event), "event"),
      };

      const message: CustomEChartIFrameMessage = {
        type: "click-event",
        data: data,
      };

      parent.postMessage(message, "*");
    });
  }

  function parseConfigurationForCallbackFns(
    chartConfig: Record<string, unknown>,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _: any,
  ) {
    const config: Record<string, unknown> = _.cloneDeep(chartConfig);

    const fnKeys = (config["__fn_keys__"] as string[]) ?? [];

    for (let i = 0; i < fnKeys.length; i++) {
      const fnString = _.get(config, fnKeys[i]);
      const fn = new Function("return " + fnString)();

      _.set(config, fnKeys[i], fn);
    }
    return config;
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function stringifyFns(fns: ((...args: any[]) => any)[]) {
    let output: string = "";
    for (const fn of fns) {
      output += fn.toString();
      output += "\n";
    }
    return output;
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function initializeECharts(echarts: any) {
    const echartsElement = document.getElementById("chartdiv");
    return echarts.init(echartsElement, undefined);
  }

  function onLoadCallback() {
    const message: CustomEChartIFrameMessage = {
      type: "load-complete",
      data: {},
    };

    parent.postMessage(message, "*");
  }

  const defaultHTMLSrcDoc = `
        <head>
            <style type="text/css">
                body {
                    margin:0 0 0 0px;
                }
            </style>
            
            <script src="/libraries/echarts@5.4.3.js"></script>
            <script src="/libraries/echarts-gl@2.0.9.js"></script>
            <script src="/libraries/lodash@4.17.21.js"></script>
        </head>

        <body>
            <div id="chartdiv" style="position:absolute; height: 100%; width: 100%;"></div>
    
            <script>
                ${stringifyFns([
                  parseConfigurationForCallbackFns,
                  initializeECharts,
                  shouldResizeECharts,
                ])}

                let echartsInstance = undefined;

                window.onload = ${stringifyFns([onLoadCallback])}

                window.onmessage = function(e) {
                    ((${stringifyFns([
                      onMessageCallback,
                    ])})(e, echartsInstance, _, echarts))
                }
            </script>
        </body>
        `;

  useEffect(() => {
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  });

  useEffect(() => {
    let shouldUpdateOptions = true;

    const propsEqual = equal(
      prevProps?.customEChartConfig,
      props.customEChartConfig,
    );

    if (errorMsg) {
      if (propsEqual) {
        shouldUpdateOptions = false;
      } else {
        setErrorMsg(undefined);
        setErrorStack(undefined);
      }
    } else {
      if (propsEqual) {
        shouldUpdateOptions = false;
      }
    }

    postMessageFn({
      options: chartOptions("CUSTOM_ECHART", props),
      shouldUpdateOptions: shouldUpdateOptions,
      shouldResize: true,
      width: props.dimensions.componentWidth,
      height: props.dimensions.componentHeight,
    });
  });

  return (
    <>
      {errorMsg && (
        <ChartErrorComponent message={errorMsg} stack={errorStack} />
      )}
      {!errorMsg && (
        <>
          <IframeContainer
            ref={iFrameRef}
            sandbox="allow-scripts"
            scrolling="no"
            srcDoc={defaultHTMLSrcDoc}
            style={{ height: "100%", width: "100%" }}
          />
          {props.needsOverlay && <OverlayDiv data-testid="iframe-overlay" />}
        </>
      )}
    </>
  );
}
