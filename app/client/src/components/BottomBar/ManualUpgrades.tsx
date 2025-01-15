import {
  ApplicationVersion,
  updateApplication,
} from "ee/actions/applicationActions";
import {
  Button,
  Tooltip,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Callout,
} from "@appsmith/ads";
import { Text, TextType } from "@appsmith/ads-old";
import type { ReactNode } from "react";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  selectApplicationVersion,
  selectURLSlugs,
} from "selectors/editorSelectors";
import styled from "styled-components";
import { createMessage, CLEAN_URL_UPDATE } from "ee/constants/messages";
import { useLocation } from "react-router";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import classNames from "classnames";

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
      color: var(--ads-v2-color-fg-brand);
    }
    code {
      padding: var(--ads-v2-spaces-2);
      background-color: var(--ads-v2-color-bg-subtle);
      color: var(--ads-v2-color-fg);
      border-radius: var(--ads-v2-border-radius);
      display: flex;
      align-items: center;
      font-size: 12px;
      line-break: anywhere;
    }
  }
`;

const StyledTrigger = styled.div``;
const Title = styled(Text)`
  color: var(--ads-v2-color-fg-emphasis);
  font-size: 16px;
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
    <Modal onOpenChange={closeModal} open={showModal}>
      <ModalContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        // Don't close Modal when pressed outside
        onInteractOutside={(e) => e.preventDefault()}
        style={{ width: "640px" }}
      >
        <ModalHeader>Product updates</ModalHeader>
        <ModalBody id="manual-upgrades-modal">
          {updates.slice(applicationVersion - 1).map((update) => (
            <div className="" key={update.name}>
              <div className="mb-4">
                <Title type={TextType.H3}>{update.name}</Title>
              </div>
              <StyledList>
                {update.description.map((desc, idx) => (
                  <li dangerouslySetInnerHTML={{ __html: desc }} key={idx} />
                ))}
              </StyledList>
              <Callout kind="warning">
                <div
                  dangerouslySetInnerHTML={{ __html: update.disclaimer.desc }}
                />
              </Callout>
            </div>
          ))}
        </ModalBody>
        <ModalFooter>
          <Button
            className="t--upgrade-confirm"
            isLoading={isLoading}
            kind="primary"
            onClick={() => {
              setIsLoading(true);
              AnalyticsUtil.logEvent("MANUAL_UPGRADE_CLICK");
              dispatch(
                updateApplication(
                  applicationId,
                  {
                    applicationVersion: latestVersion,
                  },
                  window.location.reload.bind(window.location),
                ),
              );
            }}
            size="md"
          >
            Update
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function ManualUpgrades(props: {
  children: ReactNode;
  inline?: boolean;
  showTooltip?: boolean;
}) {
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
    <div>
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
    <div
      className={classNames({
        relative: true,
        "inline-block": props.inline,
        padding: "9px 16px",
        "border-left": "1px solid #e7e7e7",
      })}
      data-testid="update-indicator"
    >
      <Tooltip content={tooltipContent} isDisabled={!props.showTooltip}>
        <StyledTrigger
          onClick={() => {
            setShowModal(applicationVersion < latestVersion);
          }}
        >
          {props.children}
        </StyledTrigger>
      </Tooltip>
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
