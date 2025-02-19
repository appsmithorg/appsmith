import { PaginationSubComponent } from "components/formControls/utils";
import { EvaluationSubstitutionType } from "ee/entities/DataTree/types";

/*
  We kept the graphql constants in this file because we were facing an error : Uncaught TypeError: Cannot read properties of undefined (reading 'register'). So we kept these variables at one place in this file to make sure this is not present in different files.
 */

// Graphql Pagination Constants
export const LIMITBASED_PREFIX = "limitBased";
export const CURSORBASED_PREFIX = "cursorBased";
export const CURSOR_PREVIOUS_PREFIX = "previous";
export const CURSOR_NEXT_PREFIX = "next";

/*
  Getting All Graphql Pagination Binding Paths
  --------------------------------------------
  The need to add graphql binding paths was because there was no such control type present in the Form Registry that handles such scenario. If we wanted to add such control type in Form Control types then there has to be a separate Component present for such control type as well. But there is no need for a new control type to handle graphql pagination. So to tackle the similar problem, a new control types i.e. Editor Control Types are added which should have E_ as a prefix for every control type to indicate that it is an editor control type.
*/
export const getAllBindingPathsForGraphqlPagination = (
  configProperty: string,
) => {
  return [
    {
      key: `${configProperty}.${LIMITBASED_PREFIX}.${PaginationSubComponent.Limit}.value`,
      value: EvaluationSubstitutionType.SMART_SUBSTITUTE,
    },
    {
      key: `${configProperty}.${LIMITBASED_PREFIX}.${PaginationSubComponent.Offset}.value`,
      value: EvaluationSubstitutionType.SMART_SUBSTITUTE,
    },
    {
      key: `${configProperty}.${CURSORBASED_PREFIX}.${CURSOR_PREVIOUS_PREFIX}.${PaginationSubComponent.Limit}.value`,
      value: EvaluationSubstitutionType.SMART_SUBSTITUTE,
    },
    {
      key: `${configProperty}.${CURSORBASED_PREFIX}.${CURSOR_PREVIOUS_PREFIX}.${PaginationSubComponent.Cursor}.value`,
      value: EvaluationSubstitutionType.SMART_SUBSTITUTE,
    },
    {
      key: `${configProperty}.${CURSORBASED_PREFIX}.${CURSOR_NEXT_PREFIX}.${PaginationSubComponent.Limit}.value`,
      value: EvaluationSubstitutionType.SMART_SUBSTITUTE,
    },
    {
      key: `${configProperty}.${CURSORBASED_PREFIX}.${CURSOR_NEXT_PREFIX}.${PaginationSubComponent.Cursor}.value`,
      value: EvaluationSubstitutionType.SMART_SUBSTITUTE,
    },
  ];
};
