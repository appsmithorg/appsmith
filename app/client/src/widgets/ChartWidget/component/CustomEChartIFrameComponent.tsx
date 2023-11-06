import React, { useEffect, useState } from "react";
import styled from "styled-components";
import type { ChartComponentConnectedProps } from ".";
import { chartOptions, dataClickCallbackHelper } from "./helpers";
import { ChartErrorComponent } from "./ChartErrorComponent";
import usePrevious from "utils/hooks/usePrevious";
import equal from "fast-deep-equal/es6";

import type * as echarts from "echarts";

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

interface MessageProps {
  props: ChartComponentConnectedProps;
  shouldUpdateOptions: boolean;
  shouldResize: boolean;
  shouldDispose: boolean;
}

export function CustomEChartIFrameComponent(
  props: ChartComponentConnectedProps,
) {
  const [errorMsg, setErrorMsg] = useState<string | undefined>(undefined);
  const [errorStack, setErrorStack] = useState<string | undefined>(undefined);
  const prevProps = usePrevious(props);
  const iframeID = props.widgetId + "-chartiframe";

  const postMessageFn = (data: MessageProps) => {
    const iFrameWindow = (
      document.getElementById(iframeID) as HTMLIFrameElement
    )?.contentWindow;
    iFrameWindow?.postMessage(
      {
        options: JSON.stringify(chartOptions("CUSTOM_ECHART", data.props)),
        shouldResize: data.shouldResize,
        shouldUpdateOptions: data.shouldUpdateOptions,
        shouldDispose: data.shouldDispose,
        width: data.props.dimensions.componentWidth,
        height: data.props.dimensions.componentHeight,
      },
      "*",
    );
  };

  const onMessage = (event: MessageEvent) => {
    const iFrameWindow = (
      document.getElementById(iframeID) as HTMLIFrameElement
    )?.contentWindow;

    if (event.source != iFrameWindow) {
      return;
    }

    const data = JSON.parse(event.data);

    if (data.type == "click-event") {
      dataClickCallbackHelper(data.event.data, props, "CUSTOM_ECHART");
    } else if (data.type == "loadcomplete") {
      postMessageFn({
        props: props,
        shouldResize: false,
        shouldDispose: false,
        shouldUpdateOptions: true,
      });
    } else if (data.type == "error") {
      setErrorMsg(data.message);
      setErrorStack(data.stack);
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
    _: any,
    echarts: any,
  ) {
    const config = e.data;
    const options = config.options;

    const parsedOptions = JSON.parse(options);
    const newOptions = parseConfigurationForCallbackFns(parsedOptions, _);

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
      parent.postMessage(
        JSON.stringify({
          type: "error",
          message: (error as Error).message,
          stack: (error as Error).stack,
        }),
        "*",
      );
    }

    echartsInstance.off("click");

    echartsInstance.on("click", (event: echarts.ECElementEvent) => {
      const newEvent = _.omit(_.cloneDeep(event), "event");
      parent.postMessage(
        JSON.stringify({ type: "click-event", event: newEvent }),
        "*",
      );
    });
  }

  function parseConfigurationForCallbackFns(chartConfig: string, _: any) {
    const config = JSON.parse(JSON.stringify(chartConfig));

    const fnKeys = (config["__fn_keys__"] as string[]) ?? [];

    for (let i = 0; i < fnKeys.length; i++) {
      const fnString = _.get(config, fnKeys[i]);
      const fn = new Function("return " + fnString)();

      _.set(config, fnKeys[i], fn);
    }
    return config;
  }

  function stringifyFns(fns: ((...args: any[]) => any)[]) {
    let output: string = "";
    for (const fn of fns) {
      output += fn.toString();
      output += "\n";
    }
    return output;
  }

  function initializeECharts(echarts: any) {
    const echartsElement = document.getElementById("chartdiv");
    return echarts.init(echartsElement, undefined);
  }

  function onLoadCallback() {
    parent.postMessage(JSON.stringify({ type: "loadcomplete" }), "*");
  }

  const defaultHTMLSrcDoc = `
        <head>
            <style type="text/css">
                body {
                    margin:0 0 0 0px;
                }
            </style>
            
            <script src="/libraries/echarts.min.js"></script>
            <script src="/libraries/echarts-gl.min.js"></script>
            <script src="/libraries/lodash.min.js"></script>
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
      props: props,
      shouldResize: true,
      shouldDispose: true,
      shouldUpdateOptions: shouldUpdateOptions,
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
            id={iframeID}
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
