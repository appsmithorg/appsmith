import {
  ApplicationVersion,
  updateApplication,
} from "actions/applicationActions";
import {
  Button,
  Category,
  Icon,
  IconSize,
  Size,
  Text,
  TextType,
} from "components/ads";
import TooltipComponent from "components/ads/Tooltip";
import ModalComponent from "components/designSystems/appsmith/ModalComponent";
import { Colors } from "constants/Colors";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  selectApplicationVersion,
} from "selectors/editorSelectors";
import styled from "styled-components";
import { useLocalStorage } from "utils/hooks/localstorage";
import { createMessage, CLEAN_URL_UPDATE } from "@appsmith/constants/messages";

const updates = [
  {
    name: createMessage(CLEAN_URL_UPDATE.name),
    shortDesc: createMessage(CLEAN_URL_UPDATE.shortDesc),
    description: [
      "All URLs in your applications will update to a new readable format that includes the application and page names.",
      'Existing references to <code style="background:#ebebeb;padding:2px 5px;border-radius:2px">appsmith.URL.fullpath</code> and <code style="background:#ebebeb;padding:2px 5px;border-radius:2px">appsmith.URL.pathname</code> properties will behave differently.',
    ],
    version: ApplicationVersion.SLUG_URL,
  },
];

function RedDot() {
  return (
    <div
      className="h-2 w-2 bg-red-600 rounded-full absolute top-0 left-3"
      data-testid="update-indicator"
    />
  );
}

const StyledList = styled.ul`
  list-style: disc;
  margin-left: 16px;
  li {
    font-size: 14px;
    font-weight: 400;
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

function UpdatesModal({
  applicationVersion,
  closeModal,
  latestVersion,
  showModal,
}: {
  showModal: boolean;
  closeModal: () => void;
  latestVersion: ApplicationVersion;
  applicationVersion: ApplicationVersion;
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
      <div className="p-6">
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
            isLoading={isLoading}
            onClick={() => {
              setIsLoading(true);
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
      </div>
    </ModalComponent>
  );
}

function ManualUpgrades() {
  const [updateDismissed, setUpdateDismissed] = useLocalStorage(
    "updateDismissed",
    "",
  );
  const applicationVersion = useSelector(selectApplicationVersion);
  const latestVersion = React.useMemo(
    () => updates.reduce((max, u) => (max > u.version ? max : u.version), 0),
    [],
  );
  const [showModal, setShowModal] = React.useState(false);

  const defaultProps =
    !updateDismissed && applicationVersion < latestVersion
      ? {
          isOpen: true,
        }
      : {};

  const tooltipContent =
    applicationVersion < latestVersion ? (
      <div className="text-sm">
        {`${latestVersion - applicationVersion} pending update(s)`}
        <ul className="mt-1">
          {updates.slice(applicationVersion - 1).map((u) => (
            <li key={u.name}>{u.shortDesc}</li>
          ))}
        </ul>
      </div>
    ) : (
      "No new updates"
    );

  return (
    <div className="t--upgrade relative">
      {applicationVersion < latestVersion && <RedDot />}
      <TooltipComponent
        autoFocus={!updateDismissed && applicationVersion < latestVersion}
        content={tooltipContent}
        modifiers={{
          preventOverflow: { enabled: true },
        }}
        {...defaultProps}
      >
        <Icon
          disabled={applicationVersion < latestVersion}
          fillColor={Colors.SCORPION}
          name="upgrade"
          onClick={() => {
            setUpdateDismissed("true");
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
      />
    </div>
  );
}

export default ManualUpgrades;
