import { UserProps } from "../types";

export const allUsers: UserProps[] = [
  {
    isChangingRole: false,
    isDeleting: false,
    name: "Ankita Kinger",
    /* roleName: "Administrator + 2 more", */
    groups: [
      {
        id: "1",
        name: "Administrator",
      },
      { id: "2", name: "Test_Admin" },
      { id: "3", name: "HR_Admin" },
    ],
    roles: [
      {
        id: "1",
        name: "Administrator-PG",
      },
      { id: "2", name: "Test_Admin-PG" },
      { id: "3", name: "HR_Admin-PG" },
    ],
    username: "techak@appsmith.com",
    userId: "123",
  },
  {
    isChangingRole: false,
    isDeleting: false,
    name: "Sangy Sivan",
    /* roleName: "App Viewer + 1 more", */
    groups: [
      { id: "4", name: "App Viewer" },
      { id: "3", name: "HR_Admin" },
    ],
    roles: [
      { id: "4", name: "App Viewer-PG" },
      { id: "3", name: "HR_Admin-PG" },
    ],
    username: "sangy@appsmith.com",
    userId: "456",
  },
  {
    isChangingRole: false,
    isDeleting: false,
    name: "SS Sivan",
    /* roleName: "App Viewer + 1 more", */
    groups: [
      { id: "4", name: "App Viewer" },
      { id: "3", name: "HR_Admin" },
    ],
    roles: [
      { id: "4", name: "App Viewer-PG" },
      { id: "3", name: "HR_Admin-PG" },
    ],
    username: "sangy123@appsmith.com",
    userId: "789",
  },
];
