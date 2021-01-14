import { Dialog, Icon } from "@blueprintjs/core";
import { IconWrapper } from "constants/IconConstants";
import { DATA_SOURCES_EDITOR_URL } from "constants/routes";
import { HeaderIcons } from "icons/HeaderIcons";
import AppInviteUsersForm from "pages/organization/AppInviteUsersForm";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "store";
import styled from "styled-components";
import { ReactComponent as BookIcon } from "assets/icons/ads/app-icons/book.svg";
import { FormDialogComponent } from "../form/FormDialogComponent";
import { getCurrentOrgId } from "selectors/organizationSelectors";
import { getCurrentApplication } from "selectors/applicationSelectors";
import { getCurrentPageId } from "selectors/editorSelectors";
import { endOnboarding } from "actions/onboardingActions";
import { getQueryParams } from "utils/AppsmithUtils";
import { getOnboardingState } from "utils/storage";
import AnalyticsUtil from "utils/AnalyticsUtil";

const StyledDialog = styled(Dialog)`
  && {
    width: 850px;
    background-color: white;
    padding-bottom: 0px;
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
  const [isOpen, setIsOpen] = useState(false);
  const orgId = useSelector(getCurrentOrgId);
  const currentApplication = useSelector(getCurrentApplication);
  const pageId = useSelector(getCurrentPageId);
  const dispatch = useDispatch();

  useEffect(() => {
    const params = getQueryParams();
    const showCompletionDialog = async () => {
      const inOnboarding = await getOnboardingState();
      if (params.onboardingComplete && inOnboarding) {
        setTimeout(() => {
          setIsOpen(true);
        }, 3000);
      }
    };

    showCompletionDialog();
  }, []);

  const onClose = () => {
    AnalyticsUtil.logEvent("END_ONBOARDING");
    setIsOpen(false);
    dispatch(endOnboarding());
  };

  return (
    <StyledDialog
      isOpen={isOpen}
      canOutsideClickClose={true}
      canEscapeKeyClose={true}
      onClose={onClose}
    >
      <ApplicationPublishedWrapper>
        <Title>
          <span role="img" aria-label="raising hands">
            🙌
          </span>{" "}
          You’re Awesome!
        </Title>
        <ContentWrapper>
          <DescriptionWrapper>
            <DescriptionTitle>
              You’ve completed this tutorial. Here’s a quick recap of things you
              learnt -
            </DescriptionTitle>
            <DescriptionList>
              <DescriptionItem>
                <span role="img" aria-label="pointing right">
                  👉
                </span>{" "}
                Querying a database
              </DescriptionItem>
              <DescriptionItem>
                <span role="img" aria-label="pointing right">
                  👉
                </span>{" "}
                Building UI using widgets.
              </DescriptionItem>
              <DescriptionItem>
                <span role="img" aria-label="pointing right">
                  👉
                </span>{" "}
                Connecting widgets to queries using {"{{}}"} bindings
              </DescriptionItem>
              <DescriptionItem>
                <span role="img" aria-label="pointing right">
                  👉
                </span>{" "}
                Deploying your application
              </DescriptionItem>
            </DescriptionList>

            <StyledButton className="t--continue-on-my-own" onClick={onClose}>
              Continue on my own
            </StyledButton>
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
              <span className="text">Read our documentation</span>
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
                window.open(
                  DATA_SOURCES_EDITOR_URL(currentApplication?.id, pageId),
                  "_blank",
                );
              }}
            >
              <Icon icon="plus" color="#716E6E" iconSize={15} />
              <span className="text">Connect your database</span>
            </QuickLinksItem>
          </QuickLinksWrapper>
        </ContentWrapper>
      </ApplicationPublishedWrapper>
    </StyledDialog>
  );
};

export default CompletionDialog;
