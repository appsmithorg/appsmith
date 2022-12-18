import { RoleProps } from "../types";

export const rolesTableData: RoleProps[] = [
  {
    id: "1",
    name: "HR_Appsmith",
    autoCreated: false,
    userPermissions: [
      "assign:permissionGroups",
      "delete:permissionGroups",
      "manage:permissionGroups",
      "read:permissionGroups",
      "unassign:permissionGroups",
    ],
  },
  {
    id: "2",
    name: "devops_design",
    autoCreated: false,
    userPermissions: [
      "assign:permissionGroups",
      "delete:permissionGroups",
      "manage:permissionGroups",
      "read:permissionGroups",
      "unassign:permissionGroups",
    ],
  },
  {
    id: "3",
    name: "devops_eng_nov",
    autoCreated: false,
    userPermissions: [
      "assign:permissionGroups",
      "manage:permissionGroups",
      "read:permissionGroups",
      "unassign:permissionGroups",
    ],
  },
  {
    id: "4",
    name: "marketing_nov",
    autoCreated: false,
    userPermissions: [
      "assign:permissionGroups",
      "delete:permissionGroups",
      "manage:permissionGroups",
      "read:permissionGroups",
      "unassign:permissionGroups",
    ],
  },
  {
    id: "5",
    name: "Administrator",
    autoCreated: true,
    userPermissions: [
      "assign:permissionGroups",
      "delete:permissionGroups",
      "manage:permissionGroups",
      "read:permissionGroups",
      "unassign:permissionGroups",
    ],
  },
  {
    id: "6",
    name: "App Viewer",
    autoCreated: true,
    userPermissions: [],
  },
];
