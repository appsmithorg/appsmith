export * from "ce/pages/AdminSettings/config";
import { ConfigFactory } from "pages/AdminSettings/config/ConfigFactory";
import { config as GroupsListing } from "@appsmith/pages/AdminSettings/config/groupsListing";
import { config as RolesListing } from "@appsmith/pages/AdminSettings/config/rolesListing";
import { config as BillingConfig } from "@appsmith/pages/AdminSettings/config/billingConfig";

ConfigFactory.register(GroupsListing);
ConfigFactory.register(RolesListing);
ConfigFactory.register(BillingConfig);

export default ConfigFactory;
