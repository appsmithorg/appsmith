import React, { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { MenuItemProps, Toaster, Variant } from "components/ads";
import { TabComponent, TabProp } from "components/ads/Tabs";
import { PageHeader } from "./PageHeader";
import { BackButton, SaveButtonBar, TabsWrapper } from "./components";
import { debounce } from "lodash";
import PermissionGroupsTree from "./PermissionGroupsTree";

export type PermissionGroupProps = {
  isEditing: boolean;
  isDeleting: boolean;
  permissionName: string;
  isAppsmithProvided: boolean;
  id: string;
  isNew?: boolean;
};

export type PermissionGroupEditProps = {
  selected: PermissionGroupProps;
  onClone: any;
  onDelete: any;
};

export const response2 = [
  {
    data: [
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [3, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
                treeOpen: true,
              },
            ],
            treeOpen: true,
          },
        ],
        treeOpen: true,
      },
      {
        id: "org2",
        name: "application 2",
        permission: [1, 1, 1, 1],
      },
      {
        id: "org3",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org4",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org5",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org6",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org7",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org8",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org9",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org10",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org11",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org12",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org13",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org14",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org15",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org16",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org17",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org18",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org19",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org20",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org1",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app1",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page1",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query1",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "org200",
        name: "appsmith internal apps",
        permission: [1, 1, 1, 1],
        subRows: [
          {
            id: "app101",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page101",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query101",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
          {
            id: "app102",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page102",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query102",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                  {
                    id: "query1020",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
          {
            id: "app103",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page103",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query103",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                  {
                    id: "query1030",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
          {
            id: "app104",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page104",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query104",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                  {
                    id: "query1040",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
          {
            id: "app105",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page105",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query105",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                  {
                    id: "query1050",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
          {
            id: "app106",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page106",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query106",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                  {
                    id: "query1060",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
              {
                id: "page107",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query107",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                  {
                    id: "query1070",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
          {
            id: "app108",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page108",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query108",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                  {
                    id: "query1080",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
              {
                id: "page109",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query109",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                  {
                    id: "query1090",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
          {
            id: "app110",
            name: "appsmith standup",
            permission: [1, 1, 1, 1],
            subRows: [
              {
                id: "page110",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query110",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                  {
                    id: "query1010",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
              {
                id: "page111",
                name: "standup form",
                permission: [1, 1, 1, 1],
                subRows: [
                  {
                    id: "query111",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                  {
                    id: "query1011",
                    name: "get_force_roster",
                    permission: [0, 1, 1, 1],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    permission: ["create", "edit", "delete", "view"],
    name: "Application Resources",
  },
  {
    data: [],
    permission: [],
    name: "Datasources & Queries",
  },
  {
    data: [],
    permission: [],
    name: "User & Permission Groups",
  },
  {
    data: [],
    permission: [],
    name: "Others",
  },
];

export function PermissionGroupAddEdit(props: PermissionGroupEditProps) {
  const { selected } = props;
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [pageTitle, setPageTitle] = useState(selected.permissionName);
  const history = useHistory();

  useEffect(() => {
    if (pageTitle !== selected.permissionName) {
      setIsSaving(true);
    } else {
      setIsSaving(false);
    }
  }, [pageTitle]);

  /*const onButtonClick = () => {
    console.log("hello onClickHandler");
  };*/

  const onSearch = debounce(
    (/*search: string*/) => {
      // if (search && search.trim().length > 0) {
      //   setSearchValue(search);
      //   const results =
      //     userTableData &&
      //     userTableData.filter((user) =>
      //       user.username?.toLocaleUpperCase().includes(search),
      //     );
      //   setData(results);
      // } else {
      //   setSearchValue("");
      //   setData(userTableData);
      // }
    },
    300,
  );

  const onSaveChanges = () => {
    /*console.log("hello save");*/
    Toaster.show({
      text: "Successfully Saved",
      variant: Variant.success,
    });
  };

  const onClearChanges = () => {
    /*console.log("hello clear");*/
    setPageTitle(selected.permissionName);
  };

  const tabs: TabProp[] = response2.map((tab) => {
    return {
      key: tab.name,
      title: tab.name,
      panelComponent: <PermissionGroupsTree tabData={tab} />,
    };
  });

  /*[
    {
      key: "application-resources",
      title: "Application Resources",
      panelComponent: <div>TAB</div>,
    },
    {
      key: "database-queries",
      title: "Datasources & Queries",
      panelComponent: <div>TAB</div>,
    },
    {
      key: "user-permission-groups",
      title: "User & Permission Groups",
      panelComponent: <div>TAB</div>,
    },
    {
      key: "others",
      title: "Others",
      panelComponent: <div>TAB</div>,
    },
  ];*/

  const onDeleteHandler = () => {
    props.onDelete && props.onDelete(selected.id);
    history.push(`/settings/permission-groups`);
  };

  const onCloneHandler = () => {
    props.onClone && props.onClone(selected);
    history.push(`/settings/permission-groups`);
  };

  const onEditTitle = (name: string) => {
    setPageTitle(name);
  };

  const menuItems: MenuItemProps[] = [
    {
      className: "clone-menu-item",
      icon: "duplicate",
      onSelect: () => onCloneHandler(),
      text: "Clone Permission Group",
      label: "clone",
    },
    {
      className: "rename-menu-item",
      icon: "edit-underline",
      text: "Rename Permission Group",
      label: "rename",
    },
    {
      className: "delete-menu-item",
      icon: "delete-blank",
      onSelect: () => onDeleteHandler(),
      text: "Delete Permission Group",
      label: "delete",
    },
  ];

  return (
    <div data-testid="t--permission-edit-wrapper">
      <BackButton />
      <PageHeader
        isEditingTitle={selected.isNew}
        isTitleEditable
        onEditTitle={onEditTitle}
        onSearch={onSearch}
        pageMenuItems={menuItems}
        searchPlaceholder="Search"
        title={pageTitle}
      />
      <TabsWrapper>
        <TabComponent
          onSelect={setSelectedTabIndex}
          selectedIndex={selectedTabIndex}
          tabs={tabs}
        />
      </TabsWrapper>
      {isSaving && (
        <SaveButtonBar onClear={onClearChanges} onSave={onSaveChanges} />
      )}
    </div>
  );
}
