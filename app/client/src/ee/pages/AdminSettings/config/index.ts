export * from "ce/pages/AdminSettings/config";
import { ConfigFactory } from "pages/Settings/config/ConfigFactory";
import { AclFactory } from "./AclFactory";
import { config as UserListing } from "@appsmith/pages/AdminSettings/config/userlisting";
import { config as UserGroupListing } from "@appsmith/pages/AdminSettings/config/userGroupListing";
import { config as PermissionGroupListing } from "@appsmith/pages/AdminSettings/config/permissionGroupListing";

AclFactory.register(UserListing);
AclFactory.register(UserGroupListing);
AclFactory.register(PermissionGroupListing);

export { AclFactory };
export default ConfigFactory;
