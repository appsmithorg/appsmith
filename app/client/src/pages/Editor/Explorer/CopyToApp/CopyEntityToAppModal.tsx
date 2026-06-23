import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Callout,
  Modal,
  ModalContent,
  ModalHeader,
  Select,
  Option,
  Text,
} from "@appsmith/ads";
import {
  hasCreateNewAppPermission,
  hasManagePagePermission,
  isPermitted,
  PERMISSION_TYPE,
} from "ee/utils/permissionHelpers";
import { getFetchedWorkspaces } from "ee/selectors/workspaceSelectors";
import { fetchAllWorkspaces } from "ee/actions/workspaceActions";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import {
  CANCEL,
  COPY_ENTITY_TO_APP_APPLICATION_LABEL,
  COPY_ENTITY_TO_APP_APPLICATION_PLACEHOLDER,
  COPY_ENTITY_TO_APP_CONFIRM,
  COPY_ENTITY_TO_APP_MODAL_TITLE,
  COPY_ENTITY_TO_APP_NO_APPS,
  COPY_ENTITY_TO_APP_NO_PAGES,
  COPY_ENTITY_TO_APP_NO_WORKSPACES,
  COPY_ENTITY_TO_APP_NOTE,
  COPY_ENTITY_TO_APP_PAGE_LABEL,
  COPY_ENTITY_TO_APP_PAGE_PLACEHOLDER,
  COPY_ENTITY_TO_APP_WORKSPACE_LABEL,
  COPY_ENTITY_TO_APP_WORKSPACE_PLACEHOLDER,
  createMessage,
} from "ee/constants/messages";
import {
  closeCopyToAppModal,
  copyActionToApp,
  copyJSActionToApp,
  fetchAppsForCopyTarget,
  fetchPagesForCopyTarget,
} from "actions/copyToAppActions";
import {
  getCopyTargetApplications,
  getCopyTargetPages,
  getCopyToAppModalEntity,
  getIsCopyingEntityToApp,
  getIsCopyToAppModalOpen,
  getIsFetchingCopyTargetApplications,
  getIsFetchingCopyTargetPages,
} from "selectors/copyToAppSelectors";
import { CopyToAppEntityType } from "./types";

const FieldWrapper = ({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) => (
  <div style={{ marginBottom: "var(--ads-v2-spaces-5)" }}>
    <Text kind="body-s" renderAs="label">
      {label}
    </Text>
    <div style={{ marginTop: "var(--ads-v2-spaces-2)" }}>{children}</div>
  </div>
);

function CopyEntityToAppModal() {
  const dispatch = useDispatch();

  const isOpen = useSelector(getIsCopyToAppModalOpen);
  const entity = useSelector(getCopyToAppModalEntity);

  const [workspaceId, setWorkspaceId] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [pageId, setPageId] = useState("");

  const currentApplicationId = useSelector(getCurrentApplicationId);
  const workspaces = useSelector(getFetchedWorkspaces);
  const applications = useSelector(getCopyTargetApplications);
  const pages = useSelector(getCopyTargetPages);
  const isFetchingApplications = useSelector(
    getIsFetchingCopyTargetApplications,
  );
  const isFetchingPages = useSelector(getIsFetchingCopyTargetPages);
  const isCopying = useSelector(getIsCopyingEntityToApp);

  const workspaceOptions = useMemo(
    () =>
      workspaces.filter((workspace) =>
        hasCreateNewAppPermission(workspace.userPermissions ?? []),
      ),
    [workspaces],
  );

  const applicationOptions = useMemo(
    () =>
      applications.filter(
        (application) =>
          // The source application cannot be a copy target.
          application.id !== currentApplicationId &&
          isPermitted(
            application.userPermissions ?? [],
            PERMISSION_TYPE.MANAGE_APPLICATION,
          ),
      ),
    [applications, currentApplicationId],
  );

  const selectedApplication = useMemo(
    () =>
      applicationOptions.find(
        (application) => application.id === applicationId,
      ),
    [applicationOptions, applicationId],
  );

  const pageOptions = useMemo(
    () =>
      pages.filter((page) =>
        hasManagePagePermission(page.userPermissions ?? []),
      ),
    [pages],
  );

  const selectedPage = useMemo(
    () => pageOptions.find((page) => page.id === pageId),
    [pageOptions, pageId],
  );

  // Reset the cascading selections and fetch workspaces when the modal opens.
  useEffect(
    function onModalOpen() {
      if (isOpen) {
        setWorkspaceId("");
        setApplicationId("");
        setPageId("");
        dispatch(fetchAllWorkspaces({ fetchEntities: false }));
      }
    },
    [isOpen, dispatch],
  );

  // Fetch applications whenever the selected workspace changes.
  useEffect(
    function fetchApplicationsOnWorkspaceChange() {
      if (workspaceId) {
        dispatch(fetchAppsForCopyTarget(workspaceId));
      }
    },
    [workspaceId, dispatch],
  );

  const handleWorkspaceSelect = (value: string) => {
    setWorkspaceId(value);
    setApplicationId("");
    setPageId("");
  };

  const handleApplicationSelect = (value: string) => {
    setApplicationId(value);
    setPageId("");
    dispatch(fetchPagesForCopyTarget(value));
  };

  const handleClose = () => {
    dispatch(closeCopyToAppModal());
  };

  const handleCopy = () => {
    if (!entity || !selectedApplication || !selectedPage) return;

    const payload = {
      entityId: entity.entityId,
      entityName: entity.entityName,
      sourcePageId: entity.sourcePageId,
      targetWorkspaceId: workspaceId,
      targetApplicationId: applicationId,
      targetApplicationName: selectedApplication.name,
      targetPageId: pageId,
      targetPageName: selectedPage.name,
      onSuccess: handleClose,
    };

    dispatch(
      entity.entityType === CopyToAppEntityType.JS_OBJECT
        ? copyJSActionToApp(payload)
        : copyActionToApp(payload),
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  const isConfirmDisabled = !workspaceId || !applicationId || !pageId;

  return (
    <Modal onOpenChange={handleOpenChange} open={isOpen}>
      <ModalContent
        className="t--copy-entity-to-app-modal"
        style={{ width: "640px" }}
      >
        <ModalHeader>
          {createMessage(COPY_ENTITY_TO_APP_MODAL_TITLE)}
        </ModalHeader>
        <FieldWrapper label={createMessage(COPY_ENTITY_TO_APP_WORKSPACE_LABEL)}>
          {workspaceOptions.length ? (
            <Select
              aria-label={createMessage(COPY_ENTITY_TO_APP_WORKSPACE_LABEL)}
              dropdownMatchSelectWidth
              onSelect={handleWorkspaceSelect}
              placeholder={createMessage(
                COPY_ENTITY_TO_APP_WORKSPACE_PLACEHOLDER,
              )}
              value={workspaceId}
            >
              {workspaceOptions.map((workspace) => (
                <Option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </Option>
              ))}
            </Select>
          ) : (
            <Text kind="body-s">
              {createMessage(COPY_ENTITY_TO_APP_NO_WORKSPACES)}
            </Text>
          )}
        </FieldWrapper>

        {!!workspaceId && (
          <FieldWrapper
            label={createMessage(COPY_ENTITY_TO_APP_APPLICATION_LABEL)}
          >
            <Select
              aria-label={createMessage(COPY_ENTITY_TO_APP_APPLICATION_LABEL)}
              dropdownMatchSelectWidth
              isLoading={isFetchingApplications}
              onSelect={handleApplicationSelect}
              placeholder={createMessage(
                COPY_ENTITY_TO_APP_APPLICATION_PLACEHOLDER,
              )}
              value={applicationId}
            >
              {applicationOptions.map((application) => (
                <Option key={application.id} value={application.id}>
                  {application.name}
                </Option>
              ))}
            </Select>
            {!isFetchingApplications && !applicationOptions.length && (
              <Text kind="body-s">
                {createMessage(COPY_ENTITY_TO_APP_NO_APPS)}
              </Text>
            )}
          </FieldWrapper>
        )}

        {!!applicationId && (
          <FieldWrapper label={createMessage(COPY_ENTITY_TO_APP_PAGE_LABEL)}>
            <Select
              aria-label={createMessage(COPY_ENTITY_TO_APP_PAGE_LABEL)}
              dropdownMatchSelectWidth
              isLoading={isFetchingPages}
              onSelect={(value: string) => setPageId(value)}
              placeholder={createMessage(COPY_ENTITY_TO_APP_PAGE_PLACEHOLDER)}
              value={pageId}
            >
              {pageOptions.map((page) => (
                <Option key={page.id} value={page.id}>
                  {page.name}
                </Option>
              ))}
            </Select>
            {!isFetchingPages && !pageOptions.length && (
              <Text kind="body-s">
                {createMessage(COPY_ENTITY_TO_APP_NO_PAGES)}
              </Text>
            )}
          </FieldWrapper>
        )}

        <Callout kind="info">{createMessage(COPY_ENTITY_TO_APP_NOTE)}</Callout>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "var(--ads-v2-spaces-3)",
            marginTop: "var(--ads-v2-spaces-5)",
          }}
        >
          <Button kind="secondary" onClick={handleClose} size="md">
            {createMessage(CANCEL)}
          </Button>
          <Button
            className="t--copy-entity-to-app-confirm"
            isDisabled={isConfirmDisabled}
            isLoading={isCopying}
            onClick={handleCopy}
            size="md"
          >
            {createMessage(COPY_ENTITY_TO_APP_CONFIRM)}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

export default CopyEntityToAppModal;
