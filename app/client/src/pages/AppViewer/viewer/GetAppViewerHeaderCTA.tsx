import React from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import {
  createMessage,
  EDIT_APP,
  FORK_APP,
  SIGN_IN,
} from "@appsmith/constants/messages";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { getTypographyByKey } from "constants/DefaultTheme";
import Button, { IconPositions } from "components/ads/Button";
import ForkApplicationModal from "pages/Applications/ForkApplicationModal";
import { TriggerButton } from "pages/Applications/ForkModalStyles";
import { Size } from "components/ads/Button";
import { getAllApplications } from "actions/applicationActions";

const Cta = styled(Button)`
  ${(props) => getTypographyByKey(props, "btnLarge")}
  height: 21px;
  span > svg {
    height: 10px;
    path {
      stroke: white;
    }
  }
`;

const ForkButton = styled(Cta)`
  svg {
    transform: rotate(-90deg);
  }
  height: ${(props) => `calc(${props.theme.smallHeaderHeight})`};
`;

function GetAppViewerHeaderCTA(props: any) {
  const {
    canEdit,
    currentApplicationDetails,
    currentUser,
    forkUrl,
    loginUrl,
    url,
  } = props;
  let CTA = null;
  const dispatch = useDispatch();

  const applicationId = currentApplicationDetails?.id;

  if (url && canEdit) {
    CTA = (
      <Cta
        className="t--back-to-editor"
        href={url}
        icon="chevron-left"
        iconPosition={IconPositions.left}
        text={createMessage(EDIT_APP)}
      />
    );
  } else if (
    currentApplicationDetails?.forkingEnabled &&
    currentApplicationDetails?.isPublic
  ) {
    if (currentUser?.username === ANONYMOUS_USERNAME) {
      CTA = (
        <ForkButton
          className="t--fork-app"
          href={forkUrl}
          icon="fork"
          text={createMessage(FORK_APP)}
        />
      );
    } else {
      CTA = (
        <div className="header__application-fork-btn-wrapper t--fork-btn-wrapper">
          <ForkApplicationModal
            applicationId={applicationId}
            trigger={
              <TriggerButton
                className="t--fork-app"
                icon="fork"
                onClick={() => dispatch(getAllApplications())}
                size={Size.small}
                text={createMessage(FORK_APP)}
              />
            }
          />
        </div>
      );
    }
  } else if (
    currentApplicationDetails?.isPublic &&
    currentUser?.username === ANONYMOUS_USERNAME
  ) {
    CTA = (
      <Cta
        className="t--sign-in"
        href={loginUrl}
        text={createMessage(SIGN_IN)}
      />
    );
  }

  return CTA;
}

export default GetAppViewerHeaderCTA;
