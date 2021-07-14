import React from "react";
import styled from "styled-components";
import TourTooltipWrapper from "components/ads/tour/TourTooltipWrapper";
import { TourType } from "entities/Tour";
import {
  commentsTourStepsEditModeTypes,
  commentsTourStepsPublishedModeTypes,
} from "./commentsTourSteps";

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
      <TourTooltipWrapper
        activeStepConfig={{
          [TourType.COMMENTS_TOUR_EDIT_MODE]:
            commentsTourStepsEditModeTypes.CREATE_UNPUBLISHED_COMMENT,
          [TourType.COMMENTS_TOUR_PUBLISHED_MODE]:
            commentsTourStepsPublishedModeTypes.CREATE_UNPUBLISHED_COMMENT,
        }}
      >
        <div />
      </TourTooltipWrapper>
    </Dot>
  );
}
