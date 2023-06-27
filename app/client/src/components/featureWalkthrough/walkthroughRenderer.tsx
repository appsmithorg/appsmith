import { Text } from "design-system";
import { hideIndicator, showIndicator } from "pages/Editor/GuidedTour/utils";
import React, { useContext, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { GifPlayer } from "design-system-old";
import thumbnail from "assets/icons/gifs/thumbnail.png";
import configPagination from "assets/icons/gifs/config_pagination.gif";
import { getPosition } from "./utils";
import type {
  FeatureDetails,
  FeatureParams,
  OffsetType,
} from "./walkthroughContext";
import WalkthroughContext from "./walkthroughContext";

const PADDING_HIGHLIGHT = 10;
const MASKID = "mask__feature";
const CLIPID = "clip__feature";

const WalkthroughWrapper = styled.div`
  left: 0px;
  top: 0px;
  position: fixed;
  width: 100%;
  height: 100%;
  color: rgb(0, 0, 0, 0.6);
  z-index: 9999;
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
  z-index: 9999;
  pointer-events: auto;
`;

type RefRectParams = {
  // body params
  bh: number;
  bw: number;
  // target params
  th: number;
  tw: number;
  tx: number;
  ty: number;
};

/*
 * Clip Path Polygon :
 * 1) 0 0 ---->  (body start) (body start)
 * 2) 0 ${ref.current.bh} ---->  (body start) (body end)
 * 3) ${ref.current.tx} ${ref.current.bh} ----> (target start) (body end)
 * 4) ${ref.current.tx} ${ref.current.ty} ----> (target start) (target start)
 * 5) ${ref.current.tx + ref.current.tw} ${ref.current.ty} ----> (target end) (target start)
 * 6) ${ref.current.tx + ref.current.tw} ${ref.current.ty + ref.current.th} ----> (target end) (target end)
 * 7) ${ref.current.tx} ${ref.current.ty + ref.current.th} ----> (target start) (target end)
 * 8) ${ref.current.tx} ${ref.current.bh} ----> (target start) (body end)
 * 9) ${ref.current.bw} ${ref.current.bh} ----> (body end) (body end)
 * 10) ${ref.current.bw} 0 ----> (body end) (body start)
 * 11) 0 0 ----> (body start) (body start)
 *
 *
 *      1,11 ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← 10
 *      ↓                                   ↑
 *      ↓               Body                ↑
 *      ↓                                   ↑
 *      ↓                                   ↑
 *      ↓         4 → → → → → → → 5         ↑
 *      ↓         ↑               ↓         ↑
 *      ↓         ↑     Target    ↓         ↑
 *      ↓         7 ← ← ← ← ← ← ← 6         ↑
 *      ↓         ↑↓                        ↑
 *      2 → → → → 3,8 → → → → → → → → → → → 9
 */

/**
 * Creates a Highlighting Mask around a target container
 * @param targetId Id for the target container to show highlighting around it
 */

const WalkthroughRenderer = ({
  details,
  offset,
  onDismiss,
  targetId,
}: FeatureParams) => {
  const [display, setDisplay] = useState<boolean>(false);
  const { popFeature } = useContext(WalkthroughContext) || {};
  const ref = useRef<RefRectParams | null>(null);
  useEffect(() => {
    const highlightArea = document.querySelector(`#${targetId}`);
    if (highlightArea) {
      const boundingRect = highlightArea.getBoundingClientRect();
      const bodyRect = document.body.getBoundingClientRect();
      ref.current = {
        bw: bodyRect.width,
        bh: bodyRect.height,
        tw: boundingRect.width + 2 * PADDING_HIGHLIGHT,
        th: boundingRect.height + 2 * PADDING_HIGHLIGHT,
        tx: boundingRect.x - PADDING_HIGHLIGHT,
        ty: boundingRect.y - PADDING_HIGHLIGHT,
      };
      setDisplay(true);
    }
  }, []);

  const onDismissWalkthrough = () => {
    onDismiss && onDismiss();
    hideIndicator();
    popFeature && popFeature();
  };

  if (!display || !ref.current) return null;

  return (
    <WalkthroughWrapper>
      {showIndicator(`#${targetId}`, offset?.position)}
      <SvgWrapper
        height={ref.current.bh}
        width={ref.current.bw}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id={MASKID}>
            <rect
              fill="white"
              height={ref.current.bh}
              width={ref.current.bw}
              x="0"
              y="0"
            />
            <rect
              fill="black"
              height={ref.current.th}
              width={ref.current.tw}
              x={ref.current.tx}
              y={ref.current.ty}
            />
          </mask>
          <clipPath id={CLIPID}>
            <polygon
              // See the comments above the component declaration to understand the below points assignment.
              points={`
                0 0, 
                0 ${ref.current.bh}, 
                ${ref.current.tx} ${ref.current.bh}, 
                ${ref.current.tx} ${ref.current.ty}, 
                ${ref.current.tx + ref.current.tw} ${ref.current.ty},
                ${ref.current.tx + ref.current.tw} ${
                ref.current.ty + ref.current.th
              }, 
                ${ref.current.tx} ${ref.current.ty + ref.current.th}, 
                ${ref.current.tx} ${ref.current.bh}, 
                ${ref.current.bw} ${ref.current.bh}, 
                ${ref.current.bw} 0,
                0 0
              `}
            />
          </clipPath>
        </defs>
        <rect
          fill="currentcolor"
          height={ref.current.bh}
          style={{
            mask: 'url("#' + MASKID + '")',
          }}
          width={ref.current.bw}
          x="0"
          y="0"
        />
        <rect
          onClick={onDismissWalkthrough}
          style={{
            clipPath: 'url("#' + CLIPID + '")',
            fill: "currentcolor",
            height: ref.current.bh,
            pointerEvents: "auto",
            width: ref.current.bw,
          }}
        />
      </SvgWrapper>
      <InstructionsComponent
        details={details}
        offset={offset}
        targetId={targetId}
      />
    </WalkthroughWrapper>
  );
};

const InstructionsComponent = ({
  details,
  offset,
  targetId,
}: {
  details?: FeatureDetails;
  offset?: OffsetType;
  targetId: string;
}) => {
  if (!details) return null;

  const positionAttr = getPosition({
    targetId,
    offset,
  });

  return (
    <InstructionsWrapper style={{ ...positionAttr }}>
      <Text kind="heading-s" renderAs="p">
        {details.title}
      </Text>
      <Text>{details.description}</Text>
      <GifPlayer gif={configPagination} thumbnail={thumbnail} />
    </InstructionsWrapper>
  );
};

export default WalkthroughRenderer;
