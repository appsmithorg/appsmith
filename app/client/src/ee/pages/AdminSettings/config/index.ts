export * from "ce/pages/AdminSettings/config";
import { ConfigFactory } from "pages/Settings/config/ConfigFactory";
import { AclFactory } from "./AclFactory";
import { config as UserListing } from "@appsmith/pages/AdminSettings/config/userlisting";
import { config as GroupsListing } from "@appsmith/pages/AdminSettings/config/groupsListing";
import { config as RolesListing } from "@appsmith/pages/AdminSettings/config/rolesListing";

AclFactory.register(UserListing);
AclFactory.register(GroupsListing);
AclFactory.register(RolesListing);

export { AclFactory };
export default ConfigFactory;
