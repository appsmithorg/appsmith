import type { Workflow } from "@appsmith/constants/WorkflowConstants";
import type { Workspace } from "@appsmith/constants/workspaceConstants";

export interface WorkflowCardListProps {
  isMobile: boolean;
  workspaceId: string;
  workflows?: Workflow[];
  workspace: Workspace;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function WorkflowCardList(props: WorkflowCardListProps) {
  return null;
}

export default WorkflowCardList;
