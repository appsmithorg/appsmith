import React from "react";
import styled from "styled-components";
import TourTooltipWrapper from "components/ads/tour/TourTooltipWrapper";
import { TourType } from "entities/Tour";

const Dot = styled.div`
  position: fixed;
  top: 50%;
  left: calc(125px + 50%);
  width: 0px;
  height: 0px;
`;

export default function AddCommentTourComponent() {
  return (
    <Dot>
      <TourTooltipWrapper tourIndex={1} tourType={TourType.COMMENTS_TOUR}>
        <div />
      </TourTooltipWrapper>
    </Dot>
  );
}
