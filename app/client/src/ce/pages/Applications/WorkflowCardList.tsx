import type { Workflow } from "ee/constants/WorkflowConstants";
import type { Workspace } from "ee/constants/workspaceConstants";

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
