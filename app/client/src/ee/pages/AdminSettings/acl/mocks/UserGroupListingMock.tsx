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
  },
  /*{
    isEditing: false,
    isDeleting: false,
    name: "contractors_ruby",
    id: "789",
    allRoles: [
      "HR_Appsmith",
      "devops_design",
      "devops_eng_nov",
      "marketing_nov",
    ],
    roles: ["Administrator", "App Viewer"],
    users: [
      {
        isChangingRole: false,
        isDeleting: false,
        name: "Ankita Kinger",
        allGroups: ["Administrator", "Test_Admin", "HR_Admin"],
        username: "techak@appsmith.com",
        id: "123",
        allRoles: [],
      },
      {
        isChangingRole: false,
        isDeleting: false,
        name: "Hello",
        username: "hello123@appsmith.com",
        id: "456",
        allGroups: [],
        allRoles: [],
      },
    ],
  },
  {
    isEditing: false,
    isDeleting: false,
    name: "marketing_newsletter",
    id: "103",
    allRoles: ["HR_Appsmith", "marketing_nov", "Administrator", "App Viewer"],
    roles: ["devops_design", "devops_eng_nov"],
    users: [
      {
        isChangingRole: false,
        isDeleting: false,
        name: "Ankita Kinger",
        allGroups: ["Administrator", "Test_Admin", "HR_Admin"],
        username: "techak@appsmith.com",
        id: "123",
        allRoles: [],
      },
      {
        isChangingRole: false,
        isDeleting: false,
        name: "Hello",
        username: "hello123@appsmith.com",
        id: "456",
        allGroups: [],
        allRoles: [],
      },
    ],
  },
  {
    isEditing: false,
    isDeleting: false,
    name: "Administrator",
    id: "120",
    allRoles: [
      "HR_Appsmith",
      "devops_design",
      "devops_eng_nov",
      "marketing_nov",
      "App Viewer",
    ],
    roles: ["Administrator"],
    users: [
      {
        isChangingRole: false,
        isDeleting: false,
        name: "Ankita Kinger",
        allGroups: ["Administrator", "Test_Admin", "HR_Admin"],
        username: "techak@appsmith.com",
        id: "123",
        allRoles: [],
      },
      {
        isChangingRole: false,
        isDeleting: false,
        name: "Hello",
        username: "hello123@appsmith.com",
        id: "456",
        allGroups: [],
        allRoles: [],
      },
    ],
  },
  {
    isEditing: false,
    isDeleting: false,
    name: "App Viewer",
    id: "125",
    allRoles: [
      "HR_Appsmith",
      "devops_design",
      "devops_eng_nov",
      "marketing_nov",
      "Administrator",
    ],
    roles: ["App Viewer"],
    users: [
      {
        isChangingRole: false,
        isDeleting: false,
        name: "Ankita Kinger",
        username: "techak@appsmith.com",
        id: "123",
        allGroups: [],
        allRoles: [],
      },
      {
        isChangingRole: false,
        isDeleting: false,
        name: "Hello",
        username: "hello123@appsmith.com",
        id: "456",
        allGroups: [],
        allRoles: [],
      },
    ],
  },*/
];
