/* eslint-disable @typescript-eslint/ban-types */
import React, { useEffect, useRef } from "react";
import ReactJson from "react-json-view";
import { JsonWrapper, reactJsonProps } from "./JsonWrapper";
import { componentWillAppendToBody } from "react-append-to-body";
import { MenuDivider } from "design-system-old";
import { debounce } from "lodash";

export type PeekOverlayStateProps = {
  name: string;
  position: DOMRect;
  textWidth: number;
  data: unknown;
  dataType: string;
};

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
      onMouseEnter={() => debouncedHide.cancel()}
      onMouseLeave={() => debouncedHide()}
      onWheel={(ev) => ev.stopPropagation()}
      style={{
        position: "absolute",
        minHeight: "46px",
        maxHeight: "152px", // +2 px to accomodate scroll bar without distortion
        width: "300px",
        backgroundColor: "white",
        boxShadow: "0px 0px 10px #0000001A",
        left: `${props.position.left + props.position.width - 300}px`,
        bottom: `calc(100vh - ${props.position.top}px)`,
        zIndex: 3,
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
