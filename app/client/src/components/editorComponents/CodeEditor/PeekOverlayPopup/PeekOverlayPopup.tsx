import React, { useEffect } from "react";
import ReactJson from "react-json-view";
import { JsonWrapper, reactJsonProps } from "./JsonWrapper";
import { componentWillAppendToBody } from "react-append-to-body";
import { MenuDivider } from "design-system-old";
import { debounce } from "lodash";
import { zIndexLayers } from "constants/CanvasEditorConstants";

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
  useEffect(() => {
    const callback = () => {
      props.hidePeekOverlay();
    };
    window.addEventListener("wheel", callback);
    return () => {
      window.removeEventListener("wheel", callback);
    };
  }, []);

  const debouncedHide = debounce(
    () => props.hidePeekOverlay(),
    PEEK_OVERLAY_DELAY,
  );

  return (
    <div
      className={`absolute ${zIndexLayers.PEEK_OVERLAY}`}
      onMouseEnter={() => debouncedHide.cancel()}
      onMouseLeave={() => debouncedHide()}
      onWheel={(ev) => ev.stopPropagation()}
      style={{
        minHeight: "46px",
        maxHeight: "152px", // +2 px to accomodate scroll bar without distortion
        width: "300px",
        backgroundColor: "var(--appsmith-color-black-0)",
        boxShadow: "0px 0px 10px #0000001A", // color used from designs
        left: `${props.position.left + props.position.width - 300}px`,
        bottom: `calc(100vh - ${props.position.top}px)`,
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
        {props.dataType === "object"
          ? Array.isArray(props.data)
            ? "array"
            : "object"
          : props.dataType}
      </div>
      <MenuDivider style={{ margin: 0 }} />
      <div
        style={{
          minHeight: "20px",
          padding: "2px 0px 2px 12px",
          fontSize: "10px",
        }}
      >
        {props.dataType === "object" && (
          <JsonWrapper
            style={{
              minHeight: "20px",
              maxHeight: "125px",
              overflowY: "auto",
            }}
          >
            <ReactJson src={props.data} {...reactJsonProps} />
          </JsonWrapper>
        )}
        {props.dataType === "function" && (
          <div>{(props.data as any).toString()}</div>
        )}
        {props.dataType !== "object" && props.dataType !== "function" && (
          <div>{(props.data as any)?.toString() ?? props.dataType}</div>
        )}
      </div>
    </div>
  );
}
