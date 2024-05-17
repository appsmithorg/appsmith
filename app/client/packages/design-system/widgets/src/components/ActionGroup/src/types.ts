import type {
  ACTION_GROUP_ALIGNMENTS,
  ButtonGroupProps,
} from "../../ButtonGroup";

export interface ActionGroupProps<T> extends ButtonGroupProps<T> {
  alignment?: keyof typeof ACTION_GROUP_ALIGNMENTS;
}
