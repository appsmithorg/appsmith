export * from "ce/pages/AdminSettings/config";
import { ConfigFactory } from "pages/Settings/config/ConfigFactory";
import { AclFactory } from "./AclFactory";
import { config as UserListing } from "@appsmith/pages/AdminSettings/config/userlisting";
import { config as GroupsListing } from "@appsmith/pages/AdminSettings/config/groupsListing";
import { config as RolesListing } from "@appsmith/pages/AdminSettings/config/rolesListing";
import { config as AuditLogsConfig } from "@appsmith/pages/AdminSettings/config/auditLogsConfig";
import { config as BillingConfig } from "@appsmith/pages/AdminSettings/config/billingConfig";
import { OthersFactory } from "./OthersFactory";

AclFactory.register(UserListing);
AclFactory.register(GroupsListing);
AclFactory.register(RolesListing);
OthersFactory.register(AuditLogsConfig);
OthersFactory.register(BillingConfig);

export { AclFactory, OthersFactory };
export default ConfigFactory;
