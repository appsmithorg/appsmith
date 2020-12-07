import { Dialog, Icon } from "@blueprintjs/core";
import { IconWrapper } from "constants/IconConstants";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { DATA_SOURCES_EDITOR_URL } from "constants/routes";
import { HeaderIcons } from "icons/HeaderIcons";
import AppInviteUsersForm from "pages/organization/AppInviteUsersForm";
import React from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "store";
import styled from "styled-components";
import { ReactComponent as BookIcon } from "assets/icons/ads/book.svg";
import { FormDialogComponent } from "../form/FormDialogComponent";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import { getCurrentApplication } from "selectors/applicationSelectors";
import history from "utils/history";
import { getCurrentPageId } from "selectors/editorSelectors";

const StyledDialog = styled(Dialog)`
  && {
    width: 850px;
    background-color: white;
  }
`;

const ApplicationPublishedWrapper = styled.div`
  padding: 33px;
`;

const Title = styled.div`
  font-weight: bold;
  font-size: 36px;
`;

const ContentWrapper = styled.div`
  display: flex;
  margin-top: 18px;
`;

const DescriptionWrapper = styled.div`
  flex: 1;
  font-size: 17px;
`;

const DescriptionTitle = styled.div`
  font-weight: 500;
  font-size: 17px;
`;

const DescriptionList = styled.div`
  margin-top: 8px;
`;

const DescriptionItem = styled.div`
  margin-top: 12px;
`;

const QuickLinksWrapper = styled.div`
  margin-left: 83px;
  color: #716e6e;
`;

const QuickLinksTitle = styled.div`
  font-size: 14px;
`;

const QuickLinksItem = styled.div`
  font-size: 17px;
  border-bottom: 1px solid #716e6e;
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-top: 13px;

  .text {
    margin-left: 3px;
  }
`;

const StyledButton = styled.button`
  color: white;
  background-color: #f3672a;
  font-weight: 600;
  font-size: 17px;
  padding: 12px 24px;
  border: none;
  cursor: pointer;
  margin-top: 30px;
`;

const CompletionDialog = () => {
  const showCompletionDialog = useSelector(
    state => state.ui.onBoarding.showCompletionDialog,
  );
  const orgId = useSelector(getCurrentOrgId);
  const currentApplication = useSelector(getCurrentApplication);
  const pageId = useSelector(getCurrentPageId);
  const dispatch = useDispatch();

  const onClose = () => {
    dispatch({
      type: ReduxActionTypes.SHOW_ONBOARDING_COMPLETION_DIALOG,
      payload: false,
    });
    dispatch({
      type: "END_ONBOARDING",
    });
  };

  return (
    <StyledDialog
      isOpen={showCompletionDialog}
      canOutsideClickClose={true}
      canEscapeKeyClose={true}
      onClose={onClose}
    >
      <ApplicationPublishedWrapper>
        <Title>🙌 You’re Awesome!</Title>
        <ContentWrapper>
          <DescriptionWrapper>
            <DescriptionTitle>
              You’ve completed this tutorial. Here’s a quick recap of things you
              learnt -
            </DescriptionTitle>
            <DescriptionList>
              <DescriptionItem>👉 Querying a database</DescriptionItem>
              <DescriptionItem>👉 Building UI using widgets.</DescriptionItem>
              <DescriptionItem>
                👉 Connecting widgets to queries using {"{{}}"} bindings
              </DescriptionItem>
            </DescriptionList>

            <StyledButton onClick={onClose}>Continue on my Own</StyledButton>
          </DescriptionWrapper>
          <QuickLinksWrapper>
            <QuickLinksTitle>Quick Links:</QuickLinksTitle>
            <QuickLinksItem
              onClick={() =>
                window.open("https://docs.appsmith.com/", "_blank")
              }
            >
              <IconWrapper color="#716E6E" width={14} height={17}>
                <BookIcon />
              </IconWrapper>
              <span className="text">Read our Documentation</span>
            </QuickLinksItem>
            <FormDialogComponent
              trigger={
                <QuickLinksItem>
                  <HeaderIcons.SHARE color={"#716E6E"} width={14} height={17} />
                  <span className="text">Invite users to your app</span>
                </QuickLinksItem>
              }
              canOutsideClickClose={true}
              Form={AppInviteUsersForm}
              orgId={orgId}
              applicationId={currentApplication?.id}
              title={
                currentApplication
                  ? currentApplication.name
                  : "Share Application"
              }
            />
            <QuickLinksItem
              onClick={() => {
                onClose();
                history.push(
                  DATA_SOURCES_EDITOR_URL(currentApplication?.id, pageId),
                );
              }}
            >
              <Icon icon="plus" color="#716E6E" iconSize={15} />
              <span className="text">Connect your Database</span>
            </QuickLinksItem>
          </QuickLinksWrapper>
        </ContentWrapper>
      </ApplicationPublishedWrapper>
    </StyledDialog>
  );
};

export default CompletionDialog;
