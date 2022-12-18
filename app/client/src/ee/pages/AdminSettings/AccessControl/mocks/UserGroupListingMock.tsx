import { GroupProps } from "../types";

export const userGroupTableData: GroupProps[] = [
  {
    name: "Eng_New",
    id: "123",
    allRoles: [
      {
        id: "1",
        name: "devops_eng_nov",
      },
      {
        id: "2",
        name: "marketing_nov",
      },
      {
        id: "3",
        name: "Administrator",
      },
      {
        id: "4",
        name: "App Viewer",
      },
    ],
    roles: [
      {
        id: "5",
        name: "HR_Appsmith",
      },
      {
        id: "6",
        name: "devops_design",
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
      },
      {
        id: "6",
        name: "devops_design",
      },
      {
        id: "3",
        name: "Administrator",
      },
      {
        id: "4",
        name: "App Viewer",
      },
    ],
    roles: [
      {
        id: "1",
        name: "devops_eng_nov",
      },
      {
        id: "2",
        name: "marketing_nov",
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
      },
      {
        id: "6",
        name: "devops_design",
      },
      {
        id: "3",
        name: "Administrator",
      },
      {
        id: "4",
        name: "App Viewer",
      },
    ],
    roles: [
      {
        id: "1",
        name: "devops_eng_nov",
      },
      {
        id: "2",
        name: "marketing_nov",
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
