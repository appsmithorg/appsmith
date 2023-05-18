import type { MutableRefObject } from "react";
import React, { useEffect, useRef } from "react";
import ReactJson from "react-json-view";
import { JsonWrapper, reactJsonProps } from "./JsonWrapper";
import { componentWillAppendToBody } from "react-append-to-body";
import { MenuDivider } from "design-system-old";
import { debounce } from "lodash";
import { zIndexLayers } from "constants/CanvasEditorConstants";
import { objectCollapseAnalytics, textSelectAnalytics } from "./Analytics";

export type PeekOverlayStateProps = {
  name: string;
  position: DOMRect;
  textWidth: number;
  data: unknown;
  dataType: string;
};

/*
 * using `componentWillAppendToBody` to work with variable height for peek overlay
 * we need a container that doesn't apply `position: absolute` to itself with zero height (bp3-portal does this)
 * Because then, child elements cannot be positioned using `bottom` property
 * with `react-append-to-body`, the container won't have `position: absolute`
 * instead we're applying it to the child element `<div>` directly, hence we can position using `bottom` property.
 */
export const PeekOverlayPopUp = componentWillAppendToBody(
  PeekOverlayPopUpContent,
);

export const PEEK_OVERLAY_DELAY = 200;

export function PeekOverlayPopUpContent(
  props: PeekOverlayStateProps & {
    hidePeekOverlay: () => void;
  },
) {
  const CONTAINER_MAX_HEIGHT_PX = 252;
  const dataWrapperRef: MutableRefObject<HTMLDivElement | null> = useRef(null);

  useEffect(() => {
    const wheelCallback = () => {
      props.hidePeekOverlay();
    };

    window.addEventListener("wheel", wheelCallback);
    return () => {
      window.removeEventListener("wheel", wheelCallback);
    };
  }, []);

  useEffect(() => {
    if (!dataWrapperRef.current) return;
    dataWrapperRef.current.addEventListener("copy", textSelectAnalytics);
    return () =>
      dataWrapperRef.current?.removeEventListener("copy", textSelectAnalytics);
  }, [dataWrapperRef, dataWrapperRef.current]);

  const debouncedHide = debounce(
    () => props.hidePeekOverlay(),
    PEEK_OVERLAY_DELAY,
  );

  const getDataTypeHeader = (dataType: string) => {
    if (props.dataType === "object") {
      if (Array.isArray(props.data)) return "array";
      if (props.data === null) return "null";
    }
    return dataType;
  };

  return (
    <div
      className={`absolute ${zIndexLayers.PEEK_OVERLAY}`}
      id="t--peek-overlay-container"
      onMouseEnter={() => debouncedHide.cancel()}
      onMouseLeave={() => debouncedHide()}
      onWheel={(ev) => ev.stopPropagation()}
      style={{
        minHeight: "46px",
        maxHeight: `${CONTAINER_MAX_HEIGHT_PX}px`,
        width: "300px",
        backgroundColor: "var(--appsmith-color-black-0)",
        boxShadow: "0px 0px 10px #0000001A", // color used from designs
        left: `${props.position.left + props.position.width - 300}px`,
        ...(props.position.top >= CONTAINER_MAX_HEIGHT_PX
          ? {
              bottom: `calc(100vh - ${props.position.top}px)`,
            }
          : {
              top: `${props.position.bottom}px`,
            }),
      }}
    >
      <div
        className="first-letter:uppercase"
        style={{
          height: "24px",
          color: "var(--appsmith-color-black-700)",
          padding: "4px 0px 4px 12px",
          fontSize: "10px",
        }}
      >
        {getDataTypeHeader(props.dataType)}
      </div>
      <MenuDivider style={{ margin: 0 }} />
      <div
        id="t--peek-overlay-data"
        ref={dataWrapperRef}
        style={{
          minHeight: "20px",
          padding: "2px 0px 2px 12px",
          fontSize: "10px",
        }}
      >
        {props.dataType === "object" && props.data !== null && (
          <JsonWrapper
            onClick={objectCollapseAnalytics}
            style={{
              minHeight: "20px",
              maxHeight: "225px",
              overflowY: "auto",
            }}
          >
            <ReactJson src={props.data} {...reactJsonProps} />
          </JsonWrapper>
        )}
        {props.dataType === "function" && (
          <div>{(props.data as any).toString()}</div>
        )}
        {props.dataType === "boolean" && (
          <div>{(props.data as any).toString()}</div>
        )}
        {props.dataType === "string" && (
          <div>{(props.data as any).toString()}</div>
        )}
        {props.dataType === "number" && (
          <div>{(props.data as any).toString()}</div>
        )}
        {((props.dataType !== "object" &&
          props.dataType !== "function" &&
          props.dataType !== "boolean" &&
          props.dataType !== "string" &&
          props.dataType !== "number") ||
          props.data === null) && (
          <div>
            {(props.data as any)?.toString() ??
            props.data ??
            props.data === undefined
              ? "undefined"
              : "null"}
          </div>
        )}
      </div>
    </div>
  );
}
