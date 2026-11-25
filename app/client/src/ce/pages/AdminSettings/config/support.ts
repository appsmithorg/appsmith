import type { AdminConfigType } from "ee/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
} from "ee/pages/AdminSettings/config/types";
import type { User } from "constants/userConstants";
import { createMessage, SUPPORT_DIAGNOSTICS } from "ee/constants/messages";
import { SupportDiagnosticsPage } from "../SupportDiagnostics";

export const config: AdminConfigType = {
  type: SettingCategories.SUPPORT,
  controlType: SettingTypes.PAGE,
  categoryType: CategoryType.INSTANCE,
  title: createMessage(SUPPORT_DIAGNOSTICS.title),
  icon: "question-line",
  component: SupportDiagnosticsPage,
  canSave: false,
} as AdminConfigType;

export const shouldRegisterSupport = (
  user: User | undefined,
  isMultiOrgEnabled: boolean,
): boolean => user?.isSuperUser === true && !isMultiOrgEnabled;
