import { fetchingEnvironmentConfigs } from "@appsmith/actions/environmentAction";
import type { EnvironmentType } from "@appsmith/configs/types";
import {
  getEnvironments,
  isEnvironmentFetching,
} from "@appsmith/selectors/environmentSelectors";
import { Button, Icon, Text } from "design-system";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { defaultEnvironment } from "../DSDataFilter";
import { getWorkspaceFromId } from "@appsmith/selectors/workspaceSelectors";
import type { AppState } from "@appsmith/reducers";
import { ManageEnvModal, DeleteEnvModal } from "./ManageEnvModals";
import {
  CREATE_NEW_APPLICATION,
  createMessage,
  MANAGE_ENV_TITLE,
  NO_SEARCH_DATA_TEXT,
} from "@appsmith/constants/messages";
import { Table } from "design-system-old";
import { NoResultsText } from "@appsmith/pages/workspace/Members";
import history from "utils/history";
import { showAdminSettings } from "@appsmith/utils/adminSettingsHelpers";
import { getCurrentUser } from "selectors/usersSelectors";
import {
  hasCreateEnvironmentPermission,
  hasDeleteEnvironmentPermission,
  hasManageEnvironmentPermission,
} from "@appsmith/utils/permissionHelpers";
import { useEditorType } from "@appsmith/hooks";
import { useParentEntityInfo } from "@appsmith/hooks/datasourceEditorHooks";

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const HeadingWrapper = styled.div`
  width: 100%;
  display: flex;
  margin-bottom: 15px;
  justify-content: space-between;
`;

const EnvTableWrapper = styled.div`
  width: 100%;
  overflow: auto;
  height: 100%;
`;

const EnvActionsWrapper = styled.div`
  display: flex;
  height: 36px; // height is to be 56px but the padding for table data is 10 px each side
  flex-direction: row;
  gap: 8px;
  align-items: center;
  justify-content: end;
`;

export const ManageEnvironments = () => {
  const workspaceId = useParams<Record<string, string>>().workspaceId;
  const dispatch = useDispatch();
  const allEnvironments = useSelector(getEnvironments);
  const isLoading = useSelector(isEnvironmentFetching);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [envToEdit, setEnvToEdit] = useState<EnvironmentType>(
    defaultEnvironment(workspaceId),
  );
  const workspace = useSelector((state: AppState) =>
    getWorkspaceFromId(state, workspaceId),
  );
  const workspacePermissions = workspace?.userPermissions || [];
  const user = useSelector(getCurrentUser);
  const showRolesRedirect = showAdminSettings(user);
  const showCreateEnvButton =
    hasCreateEnvironmentPermission(workspacePermissions);
  const editorType = useEditorType(location.pathname);
  const { editorId } = useParentEntityInfo(editorType);

  useEffect(() => {
    dispatch(
      fetchingEnvironmentConfigs({
        workspaceId,
        editorId,
        fetchDatasourceMeta: true,
      }),
    );
  }, [dispatch, workspaceId, editorId]);

  const columns = [
    {
      Header: "Name",
      accessor: "name",
      Cell: (props: any) => {
        return <Text>{props.value}</Text>;
      },
    },
    {
      Header: "Configurations",
      accessor: "datasourceMeta.",
      Cell: (props: any) => {
        return (
          <Text>{`${
            props.row.original?.datasourceMeta?.configuredDatasources || 0
          }/${
            props.row.original?.datasourceMeta?.totalDatasources || 0
          } configured datasources`}</Text>
        );
      },
    },
    {
      Header: "",
      accessor: "actions",
      Cell: (props: any) => {
        const env = props.row.original;
        const showDeleteButton = hasDeleteEnvironmentPermission(
          env.userPermissions,
        );
        const showEditButton =
          !env.isLocked && hasManageEnvironmentPermission(env.userPermissions);
        return (
          <EnvActionsWrapper>
            {showEditButton && (
              <Button
                isDisabled={env.isLocked}
                isIconButton
                kind="secondary"
                onClick={() => {
                  setEnvToEdit(env);
                  setIsManageModalOpen(true);
                }}
                size="md"
              >
                <Icon name="edit-line" />
              </Button>
            )}
            {showRolesRedirect && (
              <Button
                isIconButton
                kind="secondary"
                onClick={() => {
                  history.push(`/settings/roles`);
                }}
                size="md"
              >
                <Icon name="user-2" />
              </Button>
            )}
            {showDeleteButton && (
              <Button
                isDisabled={env.isLocked}
                isIconButton
                kind="error"
                onClick={() => {
                  if (env.isLocked) return;
                  setEnvToEdit(env);
                  setIsDeleteModalOpen(true);
                }}
                size="md"
              >
                <Icon name="delete" />
              </Button>
            )}
          </EnvActionsWrapper>
        );
      },
    },
  ];

  return (
    <>
      <Wrapper>
        <HeadingWrapper>
          <Text kind={"body-m"}>{createMessage(MANAGE_ENV_TITLE)}</Text>
          {showCreateEnvButton && (
            <Button
              isDisabled={isLoading}
              onClick={() => {
                setIsManageModalOpen(true);
              }}
              size="sm"
              startIcon="add-line"
            >
              <Text kind={"action-m"}>
                {createMessage(CREATE_NEW_APPLICATION)}
              </Text>
            </Button>
          )}
        </HeadingWrapper>
        <EnvTableWrapper>
          <Table
            columns={columns}
            data={allEnvironments}
            data-testid="t--manage-env-table"
            isLoading={isLoading}
            noDataComponent={
              <NoResultsText kind="heading-s">
                {createMessage(NO_SEARCH_DATA_TEXT)}
              </NoResultsText>
            }
          />
        </EnvTableWrapper>
      </Wrapper>
      <ManageEnvModal
        env={envToEdit}
        envList={allEnvironments}
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setEnvToEdit(defaultEnvironment(workspaceId));
        }}
        workspaceId={workspaceId}
      />
      <DeleteEnvModal
        env={envToEdit}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setEnvToEdit(defaultEnvironment(workspaceId));
        }}
        workspaceName={workspace?.name || ""}
      />
    </>
  );
};
