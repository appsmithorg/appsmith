export * from "ce/constants/workspaceConstants";
import type { WorkspaceUser as CE_WorkspaceUser } from "ce/constants/workspaceConstants";

export type WorkspaceUser = CE_WorkspaceUser & {
  userGroupId?: string;
};
