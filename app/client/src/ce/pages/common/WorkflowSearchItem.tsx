import type { Workflow } from "ee/constants/WorkflowConstants";

export interface WorkflowSearchItemProps {
  workflowsList: Workflow[];
}

const WorkflowSearchItem = (props: WorkflowSearchItemProps) => {
  // eslint-disable-next-line
  const { workflowsList } = props;

  return null;
};

export default WorkflowSearchItem;
