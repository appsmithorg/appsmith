import React, { useEffect, useRef } from "react";
import type { ComponentProps } from "widgets/BaseComponent";
import { omit } from "workers/common/JSLibrary/lodash-wrapper";
import styled from "styled-components";

export interface CustomComponentProps extends ComponentProps {
  execute: (data: any) => void;
  update: (data: any) => void;
}

const StyledIframe = styled.iframe`
  width: 100%;
  height: 100%;
`;

function CustomComponent(props: any) {
  const _props = omit(props, [
    "wrapperRef",
    "__evaluation__",
    "bindingPaths",
    "reactivePaths",
    "privateWidgets",
    "propertyOverrideDependency",
    "overridingPropertyPaths",
    "isMetaPropDirty",
    "selectedWidgetAncestry",
    "onReset",
    "metaWidgetChildrenStructure",
    "childWidgets",
    "flattenedChildCanvasWidgets",
    "googleMapsApiKey",
    "maincanvasWidth",
    "metaState",
    "dispatch",
    "commitBatchMetaUpdates",
    "pushBatchMetaUpdates",
    "updateWidgetMetaProperty",
    "dragDisabled",
    "dropDisabled",
    "isDeletable",
    "resizeDisabled",
    "disablePropertyPane",
    "update",
    "execute",
    "componentLink",
  ]);

  const iframe = useRef<HTMLIFrameElement>(null);

  // useEffect(() => {
  //   if (iframe.current) {
  //     iframe.current.srcdoc = getSrcdoc("");
  //   }
  // }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const iframeWindow =
        iframe.current?.contentWindow ||
        iframe.current?.contentDocument?.defaultView;
      // Accept messages only from the current iframe
      if (event.source === iframeWindow) {
        const message = event.data;

        if (message.type === "update") {
          props.update(message.data);
        } else if (message.type === "event") {
          props.execute(message.data);
        }
      }
    };
    // add a listener
    window.addEventListener("message", handler, false);
    // clean up
    return () => window.removeEventListener("message", handler, false);
  }, []);

  useEffect(() => {
    if (iframe.current && iframe.current.contentWindow) {
      iframe.current.addEventListener("load", () => {
        iframe.current?.contentWindow?.postMessage(
          {
            id: props.widgetId,
            type: "ready",
            props: _props,
          },
          "*",
        );
      });
    }
  }, []);

  useEffect(() => {
    if (iframe.current && iframe.current.contentWindow) {
      iframe.current.contentWindow.postMessage(
        {
          id: props.widgetId,
          props: omit(props, [
            "wrapperRef",
            "__evaluation__",
            "bindingPaths",
            "reactivePaths",
            "privateWidgets",
            "propertyOverrideDependency",
            "overridingPropertyPaths",
            "isMetaPropDirty",
            "selectedWidgetAncestry",
            "onReset",
            "metaWidgetChildrenStructure",
            "childWidgets",
            "flattenedChildCanvasWidgets",
            "googleMapsApiKey",
            "maincanvasWidth",
            "metaState",
            "dispatch",
            "commitBatchMetaUpdates",
            "pushBatchMetaUpdates",
            "updateWidgetMetaProperty",
            "dragDisabled",
            "dropDisabled",
            "isDeletable",
            "resizeDisabled",
            "disablePropertyPane",
            "update",
            "execute",
            "componentLink",
          ]),
        },
        "*",
      );
    }
  }, Object.values(_props));

  return <StyledIframe ref={iframe} src={props.componentLink} />;
}

export default CustomComponent;
