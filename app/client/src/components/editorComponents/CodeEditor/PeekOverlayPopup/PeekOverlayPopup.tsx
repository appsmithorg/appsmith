import React, {
  type MutableRefObject,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useEventCallback } from "usehooks-ts";
import { componentWillAppendToBody } from "react-append-to-body";
import { debounce } from "lodash";
import { zIndexLayers } from "constants/CanvasEditorConstants";
import { useSelector } from "react-redux";
import { getConfigTree, getDataTree } from "selectors/dataTreeSelectors";
import { filterInternalProperties } from "utils/FilterInternalProperties";
import { getJSCollections } from "ee/selectors/entitiesSelector";
import * as Styled from "./styles";
import { CONTAINER_MAX_HEIGHT_PX, PEEK_OVERLAY_DELAY } from "./constants";
import { getDataTypeHeader, getPropertyData } from "./utils";
import { JSONViewer, Size } from "../../JSONViewer";

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

export function PeekOverlayPopUpContent(
  props: PeekOverlayStateProps & {
    hidePeekOverlay: () => void;
  },
) {
  const { hidePeekOverlay, objectName, position, propertyPath } = props;
  const dataWrapperRef: MutableRefObject<HTMLDivElement | null> = useRef(null);
  const dataTree = useSelector(getDataTree);
  const configTree = useSelector(getConfigTree);
  const jsActions = useSelector(getJSCollections);

  const filteredData = filterInternalProperties(
    objectName,
    dataTree[objectName],
    jsActions,
    dataTree,
    configTree,
  );

  const [jsData, dataType] = useMemo(
    // Because getPropertyData can return a function
    // And we don't want to execute it.
    () => {
      const jsData = getPropertyData(filteredData, propertyPath);
      const dataType = getDataTypeHeader(jsData);

      return [jsData, dataType];
    },
    [filteredData, propertyPath],
  );

  const debouncedHide = debounce(hidePeekOverlay, PEEK_OVERLAY_DELAY);

  const getPositionValues = useCallback(() => {
    const positionValues: { $left: string; $bottom?: string; $top?: string } = {
      // Always have a minimum of 8px from the left
      $left: Math.max(position.right - 300, 8) + "px",
    };

    // if the peek overlay is going to be more than the container height, then show it from the bottom
    if (position.top >= CONTAINER_MAX_HEIGHT_PX) {
      positionValues.$bottom = `calc(100vh - ${position.top}px)`;
    } else {
      positionValues.$top = `${position.bottom}px`;
    }

    return positionValues;
  }, [position]);

  const onWheel = useEventCallback((ev: React.WheelEvent) => {
    ev.stopPropagation();
    hidePeekOverlay();
  });

  return (
    <Styled.PeekOverlayContainer
      className={`absolute ${zIndexLayers.PEEK_OVERLAY}`}
      id="t--peek-overlay-container"
      onMouseEnter={debouncedHide.cancel}
      onMouseLeave={debouncedHide}
      onWheel={onWheel}
      {...getPositionValues()}
    >
      <Styled.DataType className="first-letter:uppercase">
        {dataType}
      </Styled.DataType>
      <Styled.BlockDivider />
      <Styled.PeekOverlayData id="t--peek-overlay-data" ref={dataWrapperRef}>
        {(dataType === "object" || dataType === "array") && jsData !== null && (
          <Styled.JsonWrapper className="as-mask">
            <JSONViewer size={Size.SMALL} src={jsData} />
          </Styled.JsonWrapper>
        )}
        {dataType === "function" && <div>{jsData.toString()}</div>}
        {dataType === "boolean" && <div>{jsData.toString()}</div>}
        {dataType === "string" && <div>{jsData.toString()}</div>}
        {dataType === "number" && <div>{jsData.toString()}</div>}
        {((dataType !== "object" &&
          dataType !== "function" &&
          dataType !== "boolean" &&
          dataType !== "string" &&
          dataType !== "array" &&
          dataType !== "number") ||
          jsData === null) && (
          <div>
            {jsData?.toString() ?? jsData ?? jsData === undefined
              ? "undefined"
              : "null"}
          </div>
        )}
      </Styled.PeekOverlayData>
    </Styled.PeekOverlayContainer>
  );
}
