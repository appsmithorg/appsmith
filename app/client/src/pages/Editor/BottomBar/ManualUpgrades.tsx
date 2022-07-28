import {
  ApplicationVersion,
  updateApplication,
} from "actions/applicationActions";
import {
  Button,
  Category,
  Icon,
  IconSize,
  IconWrapper,
  Size,
} from "components/ads";
import { TooltipComponent, Text, TextType } from "design-system";
import ModalComponent from "components/designSystems/appsmith/ModalComponent";
import { Colors } from "constants/Colors";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  selectApplicationVersion,
  selectURLSlugs,
} from "selectors/editorSelectors";
import styled from "styled-components";
import { createMessage, CLEAN_URL_UPDATE } from "@appsmith/constants/messages";
import { useLocation } from "react-router";
import DisclaimerIcon from "remixicon-react/ErrorWarningLineIcon";
import AnalyticsUtil from "utils/AnalyticsUtil";

const StyledList = styled.ul`
  list-style: disc;
  margin-left: 16px;
  li {
    font-size: 14px;
    font-weight: 400;
    line-height: 19px;
    letter-spacing: -0.24px;
    margin: 4px 0;
    a {
      color: rgb(248, 106, 43);
    }
    code {
      font-weight: 500;
      background: #ebebeb;
      padding: 0 5px;
      border-radius: 5px;
    }
  }
`;

const StyledIconContainer = styled.div`
  background: rgb(231, 231, 231);
  padding: 0.25rem;
  margin-right: 0.5rem;
  border-radius: 50%;
`;

const DisclaimerContainer = styled.div`
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  background: ${Colors.WARNING_ORANGE};
  color: ${Colors.BROWN};
  margin: 24px 0 0;
`;

const BodyContainer = styled.div`
  .close-modal > svg {
    height: 28px;
    width: 28px;
  }
`;

function UpdatesModal({
  applicationVersion,
  closeModal,
  latestVersion,
  showModal,
  updates,
}: {
  showModal: boolean;
  closeModal: () => void;
  latestVersion: ApplicationVersion;
  applicationVersion: ApplicationVersion;
  updates: {
    name: string;
    shortDesc: string;
    description: string[];
    version: ApplicationVersion;
    disclaimer: {
      desc: string;
    };
  }[];
}) {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <ModalComponent
      canEscapeKeyClose
      canOutsideClickClose={false}
      hasBackDrop
      isOpen={showModal}
      onClose={closeModal}
      overlayClassName="manual-upgrades-overlay"
      portalClassName="manual-upgrades"
      scrollContents
      width={600}
    >
      <BodyContainer className="p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center justify-start">
            <StyledIconContainer>
              <Icon
                fillColor={Colors.SCORPION}
                name="upgrade"
                size={IconSize.XXXL}
              />
            </StyledIconContainer>
            <Text type={TextType.H1}>Product Updates</Text>
          </div>
          <Icon
            className="close-modal"
            fillColor={Colors.SCORPION}
            name="close-modal"
            onClick={closeModal}
            size={IconSize.XXXL}
          />
        </div>
        {updates.slice(applicationVersion - 1).map((update) => (
          <div className="mt-4 mb-6" key={update.name}>
            <div className="mb-4">
              <Text type={TextType.H3}>{update.name}</Text>
            </div>
            <StyledList>
              {update.description.map((desc, idx) => (
                <li dangerouslySetInnerHTML={{ __html: desc }} key={idx} />
              ))}
            </StyledList>
            <DisclaimerContainer>
              <IconWrapper size={IconSize.XXXL}>
                <DisclaimerIcon color={Colors.WARNING_SOLID} />
              </IconWrapper>
              <span
                dangerouslySetInnerHTML={{ __html: update.disclaimer.desc }}
              />
            </DisclaimerContainer>
          </div>
        ))}
        <div className="flex justify-end gap-2 items-center">
          <Button
            category={Category.tertiary}
            onClick={closeModal}
            size={Size.large}
            tag="button"
            text="Dismiss"
          />
          <Button
            category={Category.primary}
            className="t--upgrade-confirm"
            isLoading={isLoading}
            onClick={() => {
              setIsLoading(true);
              AnalyticsUtil.logEvent("MANUAL_UPGRADE_CLICK");
              dispatch(
                updateApplication(
                  applicationId as string,
                  {
                    applicationVersion: latestVersion,
                  },
                  window.location.reload.bind(window.location),
                ),
              );
            }}
            size={Size.large}
            tag="button"
            text="Update"
          />
        </div>
      </BodyContainer>
    </ModalComponent>
  );
}

function ManualUpgrades() {
  const applicationVersion = useSelector(selectApplicationVersion);
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);
  const { applicationSlug, pageSlug } = useSelector(selectURLSlugs);
  const location = useLocation();

  const updates = React.useMemo(
    () => [
      {
        name: createMessage(CLEAN_URL_UPDATE.name),
        shortDesc: createMessage(CLEAN_URL_UPDATE.shortDesc),
        description: CLEAN_URL_UPDATE.description.map((formatter) =>
          createMessage(
            formatter.bind(
              null,
              window.location.href.replace(
                `/applications/${applicationId}/pages/${pageId}`,
                `/app/${applicationSlug}/${pageSlug}-${pageId}`,
              ),
            ),
          ),
        ),
        disclaimer: {
          severity: "MODERATE",
          desc: createMessage(CLEAN_URL_UPDATE.disclaimer),
        },
        version: ApplicationVersion.SLUG_URL,
      },
    ],
    [location, applicationSlug, pageSlug, pageId, applicationId],
  );
  const latestVersion = React.useMemo(
    () => updates.reduce((max, u) => (max > u.version ? max : u.version), 0),
    [],
  );
  const [showModal, setShowModal] = React.useState(false);

  const tooltipContent = (
    <div className="text-sm">
      {`${latestVersion - applicationVersion} pending update(s)`}
      <ul className="mt-1">
        {updates.slice(applicationVersion - 1).map((u) => (
          <li key={u.name}>{u.shortDesc}</li>
        ))}
      </ul>
    </div>
  );

  if (applicationVersion === latestVersion) return null;

  return (
    <div className="relative" data-testid="update-indicator">
      <TooltipComponent
        content={tooltipContent}
        modifiers={{
          preventOverflow: { enabled: true },
        }}
      >
        <Icon
          className="t--upgrade"
          fillColor={Colors.SCORPION}
          name="upgrade"
          onClick={() => {
            setShowModal(applicationVersion < latestVersion);
          }}
          size={IconSize.XXXL}
        />
      </TooltipComponent>
      <UpdatesModal
        applicationVersion={applicationVersion}
        closeModal={() => {
          setShowModal(false);
        }}
        latestVersion={latestVersion}
        showModal={showModal}
        updates={updates}
      />
    </div>
  );
}

export default ManualUpgrades;
