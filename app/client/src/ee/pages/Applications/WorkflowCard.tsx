import React, { useCallback, useEffect, useMemo, useState } from "react";
import { noop } from "lodash";
import type { MenuItemProps } from "design-system";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "design-system";
import {
  EditInteractionKind,
  EditableText,
  SavingState,
} from "design-system-old";

import Card from "components/common/Card";
import history from "utils/history";
import { generateEditedByText } from "pages/Applications/helpers";
import type { ModifiedMenuItemProps } from "pages/Applications/ApplicationCard";
import { useDispatch, useSelector } from "react-redux";
import { hasDeleteWorkflowPermission } from "@appsmith/utils/permissionHelpers";
import {
  deleteWorkflow,
  updateWorkflowName,
} from "@appsmith/actions/workflowActions";
import {
  getIsSavingWorkflowName,
  getisErrorSavingWorkflowName,
} from "@appsmith/selectors/workflowSelectors";
import type { Workflow } from "@appsmith/constants/WorkflowConstants";
import { workflowEditorURL } from "@appsmith/RouteBuilder";

interface WorkflowCardProps {
  isFetchingWorkflows: boolean;
  isMobile?: boolean;
  workflow: Workflow;
  workspaceId: string;
}

interface ContextMenuProps {
  handleMenuOnClose: (open: boolean) => void;
  isMenuOpen: boolean;
  moreActionItems: MenuItemProps[];
  onUpdateWorkflow: (val: string) => void;
  workflowName: string;
  setLastUpdatedValue: (val: string) => void;
}

const DEFAULT_BACKGROUND_COLOR = "#9747FF1A";
const DEFAULT_ICON = "workflow";

const ContextMenu = ({
  handleMenuOnClose,
  isMenuOpen,
  moreActionItems,
  onUpdateWorkflow,
  setLastUpdatedValue,
  workflowName,
}: ContextMenuProps) => {
  const isSavingName = useSelector(getIsSavingWorkflowName);
  const isErroredSavingName = useSelector(getisErrorSavingWorkflowName);

  return (
    <Menu className="more" onOpenChange={handleMenuOnClose} open={isMenuOpen}>
      <MenuTrigger>
        <Button
          className="m-0.5"
          data-testid="t--application-card-context-menu"
          isIconButton
          kind="tertiary"
          size="sm"
          startIcon="context-menu"
        />
      </MenuTrigger>
      <MenuContent side="right" style={{ maxHeight: "unset" }}>
        <div
          onKeyDown={(e) => {
            // This is to prevent the Menu component to take focus away from the input
            // https://github.com/radix-ui/primitives/issues/1175
            e.stopPropagation();
          }}
        >
          <EditableText
            className="px-3 pt-2 pb-2 t--application-name"
            defaultValue={workflowName}
            editInteractionKind={EditInteractionKind.SINGLE}
            fill
            hideEditIcon={false}
            isError={isErroredSavingName}
            isInvalid={(value: string) => {
              if (!value) {
                return "Name cannot be empty";
              } else {
                return false;
              }
            }}
            onBlur={onUpdateWorkflow}
            onTextChanged={setLastUpdatedValue}
            placeholder={"Edit text input"}
            savingState={
              isSavingName ? SavingState.STARTED : SavingState.NOT_STARTED
            }
            underline
          />
        </div>
        <div className="menu-items-wrapper">
          {moreActionItems.map((item: MenuItemProps) => {
            const { children, key, ...restMenuItem } = item;
            return (
              <MenuItem
                {...restMenuItem}
                className={
                  item.startIcon === "delete-bin-line" ? "error-menuitem" : ""
                }
                key={key}
              >
                {children}
              </MenuItem>
            );
          })}
        </div>
      </MenuContent>
    </Menu>
  );
};

function WorkflowCard({
  isFetchingWorkflows,
  isMobile,
  workflow,
}: WorkflowCardProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [moreActionItems, setMoreActionItems] = useState<
    ModifiedMenuItemProps[]
  >([]);
  const [lastUpdatedValue, setLastUpdatedValue] = useState("");
  const workflowId = workflow.id;
  const dispatch = useDispatch();

  const hasDeletePermission = hasDeleteWorkflowPermission(
    workflow.userPermissions,
  );

  useEffect(() => {
    addDeleteOption();
  }, []);

  const editedByText = generateEditedByText({
    modifiedAt: workflow.modifiedAt,
    modifiedBy: workflow.modifiedBy,
  });

  const handleMenuOnClose = useCallback(
    (open: boolean) => {
      if (!open && !isDeleting) {
        setIsMenuOpen(false);
        setShowOverlay(false);
        addDeleteOption();
        if (lastUpdatedValue && workflow.name !== lastUpdatedValue) {
          onUpdateWorkflow(lastUpdatedValue);
        }
      } else {
        setIsMenuOpen(true);
        setIsDeleting(false);
      }
    },
    [isDeleting, lastUpdatedValue, workflow.name],
  );

  const onUpdateWorkflow = (val: string) => {
    if (val !== workflow.name) {
      dispatch(updateWorkflowName(val, workflow.id));
    }
  };

  const onDeleteWorkflow = () => {
    setShowOverlay(false);
    dispatch(deleteWorkflow({ id: workflowId }));
  };

  const askForConfirmation = () => {
    setIsDeleting(true);
    const updatedActionItems = [...moreActionItems];
    updatedActionItems.pop();
    updatedActionItems.push({
      onSelect: onDeleteWorkflow,
      children: "Are you sure?",
      key: "areyousure",
      startIcon: "delete-bin-line",
      "data-testid": "t--delete",
    });
    setMoreActionItems(updatedActionItems);
  };

  const addDeleteOption = () => {
    if (hasDeletePermission) {
      const index = moreActionItems.findIndex(
        (el) => el.startIcon === "delete-bin-line",
      );
      const updatedActionItems = [...moreActionItems];
      if (index >= 0) {
        updatedActionItems.pop();
      }
      updatedActionItems.push({
        onSelect: askForConfirmation,
        children: "Delete",
        key: "delete",
        startIcon: "delete-bin-line",
        "data-testid": "t--delete-confirm",
      });
      setMoreActionItems(updatedActionItems);
    }
  };

  const contextMenu = useMemo(
    () => (
      <ContextMenu
        handleMenuOnClose={handleMenuOnClose}
        isMenuOpen={isMenuOpen}
        moreActionItems={moreActionItems}
        onUpdateWorkflow={onUpdateWorkflow}
        setLastUpdatedValue={setLastUpdatedValue}
        workflowName={workflow.name}
      />
    ),
    [handleMenuOnClose, isMenuOpen, workflow.name],
  );

  const editWorkflow = useCallback(() => {
    history.push(workflowEditorURL({ workflowId: workflow.id }));
  }, [workflow.id]);

  return (
    <Card
      backgroundColor={workflow.color || DEFAULT_BACKGROUND_COLOR}
      contextMenu={contextMenu}
      editedByText={editedByText}
      hasReadPermission
      icon={workflow.icon || DEFAULT_ICON}
      isContextMenuOpen={false}
      isFetching={isFetchingWorkflows}
      isMobile={isMobile}
      moreActionItems={moreActionItems}
      primaryAction={noop}
      setShowOverlay={setShowOverlay}
      showGitBadge={false}
      showOverlay={showOverlay}
      testId="t--workflow-card"
      title={workflow.name}
      titleTestId="t--app-card-name"
    >
      {!isMenuOpen && (
        <Button
          className="t--workflow-edit-link"
          href={workflowEditorURL({ workflowId: workflow.id })}
          onClick={editWorkflow}
          size="md"
          startIcon={"pencil-line"}
        >
          Edit
        </Button>
      )}
    </Card>
  );
}

export default WorkflowCard;
