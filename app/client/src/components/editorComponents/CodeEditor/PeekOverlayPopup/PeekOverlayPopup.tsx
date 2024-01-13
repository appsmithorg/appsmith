import type { MutableRefObject } from "react";
import { useState } from "react";
import React, { useEffect, useRef } from "react";
import ReactJson from "react-json-view";
import { JsonWrapper, reactJsonProps } from "./JsonWrapper";
import { componentWillAppendToBody } from "react-append-to-body";
import _, { debounce } from "lodash";
import { zIndexLayers } from "constants/CanvasEditorConstants";
import { objectCollapseAnalytics, textSelectAnalytics } from "./Analytics";
import { Divider } from "design-system";
import { useSelector } from "react-redux";
import { getConfigTree, getDataTree } from "selectors/dataTreeSelectors";
import { filterInternalProperties } from "utils/FilterInternalProperties";
import { getJSCollections } from "@appsmith/selectors/entitiesSelector";

export interface PeekOverlayStateProps {
  objectName: string;
  propertyPath: string[];
  position: DOMRect;
  textWidth: number;
}

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

const getPropertyData = (src: unknown, propertyPath: string[]) => {
  return propertyPath.length > 0 ? _.get(src, propertyPath) : src;
};

const getDataTypeHeader = (data: unknown) => {
  const dataType = typeof data;
  if (dataType === "object") {
    if (Array.isArray(data)) return "array";
    if (data === null) return "null";
  }
  return dataType;
};

export function PeekOverlayPopUpContent(
  props: PeekOverlayStateProps & {
    hidePeekOverlay: () => void;
  },
) {
  const CONTAINER_MAX_HEIGHT_PX = 252;
  const dataWrapperRef: MutableRefObject<HTMLDivElement | null> = useRef(null);
  const dataTree = useSelector(getDataTree);
  const configTree = useSelector(getConfigTree);
  const jsActions = useSelector(getJSCollections);

  const filteredData = filterInternalProperties(
    props.objectName,
    dataTree[props.objectName],
    jsActions,
    dataTree,
    configTree,
  );

  // Because getPropertyData can return a function
  // And we don't want to execute it.
  const [jsData] = useState(() =>
    getPropertyData(filteredData, props.propertyPath),
  );

  const [dataType] = useState(getDataTypeHeader(jsData));

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
        backgroundColor: "var(--ads-v2-color-bg)",
        boxShadow: "0px 0px 10px #0000001A", // color used from designs
        borderRadius: "var(--ads-v2-border-radius)",
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
        {dataType}
      </div>
      <Divider style={{ display: "block" }} />
      <div
        id="t--peek-overlay-data"
        ref={dataWrapperRef}
        style={{
          minHeight: "20px",
          padding: "2px 0px 2px 12px",
          fontSize: "10px",
        }}
      >
        {(dataType === "object" || dataType === "array") && jsData !== null && (
          <JsonWrapper
            onClick={objectCollapseAnalytics}
            style={{
              minHeight: "20px",
              maxHeight: "225px",
              overflowY: "auto",
            }}
          >
            <ReactJson src={jsData} {...reactJsonProps} />
          </JsonWrapper>
        )}
        {dataType === "function" && <div>{(jsData as any).toString()}</div>}
        {dataType === "boolean" && <div>{(jsData as any).toString()}</div>}
        {dataType === "string" && <div>{(jsData as any).toString()}</div>}
        {dataType === "number" && <div>{(jsData as any).toString()}</div>}
        {((dataType !== "object" &&
          dataType !== "function" &&
          dataType !== "boolean" &&
          dataType !== "string" &&
          dataType !== "array" &&
          dataType !== "number") ||
          jsData === null) && (
          <div>
            {(jsData as any)?.toString() ?? jsData ?? jsData === undefined
              ? "undefined"
              : "null"}
          </div>
        )}
      </div>
    </div>
  );
}
