import { Icon, Text, Button, Divider } from "@appsmith/ads";
import React, { useContext, useEffect, useState } from "react";
import styled from "styled-components";
import { PADDING_HIGHLIGHT, getPosition } from "./utils";
import type {
  FeatureDetails,
  FeatureParams,
  OffsetType,
} from "./walkthroughContext";
import WalkthroughContext, {
  isFeatureFooterDetails,
} from "./walkthroughContext";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { showIndicator } from "components/utils/Indicator";

const CLIPID = "clip__feature";
const Z_INDEX = 1000;

const WalkthroughDescription = styled(Text)`
  // CSS to add new line for each \n in the description
  white-space: pre-line;
`;

const WalkthroughWrapper = styled.div<{ overlayColor?: string }>`
  left: 0px;
  top: 0px;
  position: fixed;
  width: 100%;
  height: 100%;
  color: ${(props) => props.overlayColor ?? "rgb(0, 0, 0, 0.7)"};
  z-index: ${Z_INDEX};
  // This allows the user to click on the target element rather than the overlay div
  pointer-events: none;
`;

const SvgWrapper = styled.svg`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
`;

const InstructionsWrapper = styled.div`
  padding: var(--ads-v2-spaces-4);
  position: absolute;
  background: white;
  display: flex;
  flex-direction: column;
  width: 296px;
  pointer-events: auto;
  border-radius: var(--ads-radius-1);
`;

const ImageWrapper = styled.div`
  border-radius: var(--ads-radius-1);
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  padding: var(--ads-v2-spaces-7);
  img {
    max-height: 220px;
  }
`;

const InstructionsHeaderWrapper = styled.div`
  display: flex;
  p {
    flex-grow: 1;
  }
  span {
    align-self: flex-start;
    margin-top: 5px;
    cursor: pointer;
  }
`;

const FeatureFooterDivider = styled(Divider)`
  margin-top: 8px;
`;

const FeatureFooterWrapper = styled.div`
  height: 36px;
  margin-top: 8px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

interface RefRectParams {
  // body params
  bh: number;
  bw: number;
  // target params
  th: number;
  tw: number;
  tx: number;
  ty: number;
}

/*
 * Clip Path Polygon for single target with bounding rect :
 * 1) 0 0 ---->  (body start) (body start)
 * 2) 0 ${boundingRect.bh} ---->  (body start) (body end)
 * 3) ${boundingRect.tx} ${boundingRect.bh} ----> (target start) (body end)
 * 4) ${boundingRect.tx} ${boundingRect.ty} ----> (target start) (target start)
 * 5) ${boundingRect.tx + boundingRect.tw} ${boundingRect.ty} ----> (target end) (target start)
 * 6) ${boundingRect.tx + boundingRect.tw} ${boundingRect.ty + boundingRect.th} ----> (target end) (target end)
 * 7) ${boundingRect.tx} ${boundingRect.ty + boundingRect.th} ----> (target start) (target end)
 * 8) ${boundingRect.tx} ${boundingRect.bh} ----> (target start) (body end)
 * 9) ${boundingRect.bw} ${boundingRect.bh} ----> (body end) (body end)
 * 10) ${boundingRect.bw} 0 ----> (body end) (body start)
 *
 *
 *      1 ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←10
 *      ↓                                   ↑
 *      ↓               Body                ↑
 *      ↓                                   ↑
 *      ↓                                   ↑
 *      ↓         4 → → → → → → → 5         ↑
 *      ↓         ↑ / / / / / / / ↓         ↑
 *      ↓         ↑ / / /Target/ /↓         ↑
 *      ↓         ↑ / / / / / / / ↓         ↑
 *      ↓         7 ← ← ← ← ← ← ← 6         ↑
 *      ↓         ↑↓                        ↑
 *      ↓         ↑↓                        ↑
 *      2 → → → → 3,8 → → → → → → → → → → → 9
 *
 *   Repeat steps 3 to 8 for each element if there are multiple highlighting elements.
 *
 */

/**
 * Creates a Highlighting Clipping mask around a target container
 * @param targetId Id for the target container to show highlighting around it
 */

type BoundingRectTargets = Record<string, RefRectParams>;

const WalkthroughRenderer = ({
  details,
  dismissOnOverlayClick,
  eventParams = {},
  multipleHighlights,
  offset,
  overlayColor,
  targetId,
}: FeatureParams) => {
  const [boundingRects, setBoundingRects] =
    useState<BoundingRectTargets | null>(null);
  const { popFeature } = useContext(WalkthroughContext) || {};

  const multipleHighlightsIds = multipleHighlights?.length
    ? multipleHighlights
    : [targetId];
  if (multipleHighlightsIds.indexOf(targetId) === -1)
    multipleHighlightsIds.push(targetId);
  const updateBoundingRect = () => {
    const mainTarget = document.querySelector(targetId);
    if (mainTarget) {
      const data: BoundingRectTargets = {};
      multipleHighlightsIds.forEach((id) => {
        const highlightArea = document.querySelector(id);
        if (highlightArea) {
          const boundingRect = highlightArea.getBoundingClientRect();
          const bodyRect = document.body.getBoundingClientRect();
          const offsetHighlightPad =
            typeof offset?.highlightPad === "number"
              ? offset?.highlightPad
              : PADDING_HIGHLIGHT;
          data[id] = {
            bw: bodyRect.width,
            bh: bodyRect.height,
            tw: boundingRect.width + 2 * offsetHighlightPad,
            th: boundingRect.height + 2 * offsetHighlightPad,
            tx: boundingRect.x - offsetHighlightPad,
            ty: boundingRect.y - offsetHighlightPad,
          };
        }
      });

      if (Object.keys(data).length > 0) {
        setBoundingRects(data);
        showIndicator(`${targetId}`, offset?.position, {
          top: offset?.indicatorTop || 0,
          left: offset?.indicatorLeft || 0,
          zIndex: Z_INDEX + 1,
        });
      }
    }
  };

  useEffect(() => {
    updateBoundingRect();
    const highlightArea = document.querySelector(targetId);
    window.addEventListener("resize", updateBoundingRect);
    const resizeObserver = new ResizeObserver(updateBoundingRect);
    if (highlightArea) {
      AnalyticsUtil.logEvent("WALKTHROUGH_SHOWN", eventParams);
      resizeObserver.observe(highlightArea);
    }
    return () => {
      window.removeEventListener("resize", updateBoundingRect);
      if (highlightArea) resizeObserver.unobserve(highlightArea);
    };
  }, [targetId]);

  const onDismissWalkthrough = () => {
    popFeature && popFeature("WALKTHROUGH_CROSS_ICON");
  };

  if (!boundingRects || Object.keys(boundingRects).length === 0) return null;
  const targetBounds = boundingRects[targetId];

  if (!targetBounds) return null;

  return (
    <WalkthroughWrapper
      className="t--walkthrough-overlay"
      overlayColor={overlayColor}
    >
      <SvgWrapper
        height={targetBounds.bh}
        onClick={dismissOnOverlayClick ? onDismissWalkthrough : () => null}
        width={targetBounds.bw}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id={CLIPID}>
            <polygon
              // See the comments above the component declaration to understand the below points assignment.
              points={`0 0,
                    0 ${targetBounds.bh},
                    ${multipleHighlightsIds.reduce((acc, id) => {
                      const boundingRect = boundingRects[id];
                      if (boundingRect) {
                        acc = `${acc} ${boundingRect.tx} ${boundingRect.bh},
                        ${boundingRect.tx} ${boundingRect.ty},
                        ${boundingRect.tx + boundingRect.tw} ${boundingRect.ty},
                        ${boundingRect.tx + boundingRect.tw} ${
                          boundingRect.ty + boundingRect.th
                        },
                        ${boundingRect.tx} ${boundingRect.ty + boundingRect.th},
                        ${boundingRect.tx} ${boundingRect.bh},`;
                      }
                      return acc;
                    }, "")}
                    ${targetBounds.bw} ${targetBounds.bh},
                    ${targetBounds.bw} 0
                  `}
            />
          </clipPath>
        </defs>
        <rect
          style={{
            clipPath: 'url("#' + CLIPID + '")',
            fill: "currentcolor",
            height: targetBounds.bh,
            pointerEvents: "auto",
            width: targetBounds.bw,
          }}
        />
      </SvgWrapper>

      <InstructionsComponent
        details={details}
        offset={offset}
        onClose={onDismissWalkthrough}
        targetId={targetId}
      />
    </WalkthroughWrapper>
  );
};

const InstructionsComponent = ({
  details,
  offset,
  onClose,
  targetId,
}: {
  details?: FeatureDetails;
  offset?: OffsetType;
  targetId: string;
  onClose: () => void;
}) => {
  if (!details) return null;

  const positionAttr = getPosition({
    targetId,
    offset,
  });

  return (
    <InstructionsWrapper style={{ ...positionAttr }}>
      <InstructionsHeaderWrapper>
        <Text kind="heading-s" renderAs="p">
          {details.title}
        </Text>
        <Icon
          className="t--walkthrough-close"
          color="black"
          name="close"
          onClick={onClose}
          size="md"
        />
      </InstructionsHeaderWrapper>
      <WalkthroughDescription>{details.description}</WalkthroughDescription>
      {details.imageURL && (
        <ImageWrapper>
          <img src={details.imageURL} />
        </ImageWrapper>
      )}
      {!!details.footerDetails &&
        isFeatureFooterDetails(details.footerDetails) && (
          <>
            <FeatureFooterDivider />
            <FeatureFooterWrapper>
              <Text kind="body-s">{details.footerDetails.footerText}</Text>
              <Button onClick={details.footerDetails.onClickHandler} size="sm">
                {details.footerDetails.footerButtonText}
              </Button>
            </FeatureFooterWrapper>
          </>
        )}
    </InstructionsWrapper>
  );
};

export default WalkthroughRenderer;
