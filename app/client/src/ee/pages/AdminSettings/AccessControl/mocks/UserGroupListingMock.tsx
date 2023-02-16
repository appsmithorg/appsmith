import { GroupProps } from "../types";

export const userGroupTableData: GroupProps[] = [
  {
    name: "Eng_New",
    id: "123",
    allRoles: [
      {
        id: "1",
        name: "devops_eng_nov",
        autoCreated: false,
      },
      {
        id: "2",
        name: "marketing_nov",
        autoCreated: false,
      },
      {
        id: "3",
        name: "Administrator",
        autoCreated: true,
      },
      {
        id: "4",
        name: "App Viewer",
        autoCreated: true,
      },
    ],
    roles: [
      {
        id: "5",
        name: "HR_Appsmith",
        userPermissions: ["unassign:permissionGroups"],
        autoCreated: false,
      },
      {
        id: "6",
        name: "devops_design",
        userPermissions: [],
        autoCreated: false,
      },
    ],
    users: [],
    userPermissions: [
      "assign:userGroups",
      "delete:userGroups",
      "manage:userGroups",
      "read:userGroups",
      "unassign:userGroups",
    ],
  },
  {
    name: "Design",
    id: "456",
    allRoles: [
      {
        id: "5",
        name: "HR_Appsmith",
        autoCreated: false,
      },
      {
        id: "6",
        name: "devops_design",
        autoCreated: false,
      },
      {
        id: "3",
        name: "Administrator",
        autoCreated: true,
      },
      {
        id: "4",
        name: "App Viewer",
        autoCreated: true,
      },
    ],
    roles: [
      {
        id: "1",
        name: "devops_eng_nov",
        userPermissions: ["unassign:permissionGroups"],
        autoCreated: false,
      },
      {
        id: "2",
        name: "marketing_nov",
        userPermissions: ["unassign:permissionGroups"],
        autoCreated: false,
      },
    ],
    users: [
      {
        username: "techak@appsmith.com",
        id: "123",
      },
      {
        username: "hello123@appsmith.com",
        id: "456",
      },
    ],
    userPermissions: ["read:userGroups"],
  },
  {
    name: "Dev rel",
    id: "456",
    allRoles: [
      {
        id: "5",
        name: "HR_Appsmith",
        autoCreated: false,
      },
      {
        id: "6",
        name: "devops_design",
        autoCreated: false,
      },
      {
        id: "3",
        name: "Administrator",
        autoCreated: true,
      },
      {
        id: "4",
        name: "App Viewer",
        autoCreated: true,
      },
    ],
    roles: [
      {
        id: "1",
        name: "devops_eng_nov",
        userPermissions: ["unassign:permissionGroups"],
        autoCreated: false,
      },
      {
        id: "2",
        name: "marketing_nov",
        userPermissions: ["unassign:permissionGroups"],
        autoCreated: false,
      },
    ],
    users: [
      {
        username: "ss@appsmith.com",
        id: "123",
      },
      {
        username: "hello123@appsmith.com",
        id: "456",
      },
    ],
    userPermissions: ["read:userGroups", "manage:userGroups"],
  },
];
