export const menuItems = [
  { id: 1, label: "Aerospace" },
  { id: 2, label: "Mechanical" },
  { id: 3, label: "Civil" },
  { id: 4, label: "Biomedical" },
  { id: 5, label: "Nuclear" },
  { id: 6, label: "Industrial" },
  { id: 7, label: "Chemical" },
  { id: 8, label: "Agricultural" },
  { id: 9, label: "Electrical" },
];

export const submenusItems = [
  { id: 1, label: "Level 1-1" },
  {
    id: 2,
    label: "Level 1-2",
    childItems: [
      { id: 21, label: "Level 2-1" },
      {
        id: 22,
        label: "Level 2-2",
        childItems: [
          { id: 31, label: "Level 3-1" },
          { id: 32, label: "Level 3-2" },
        ],
      },
    ],
  },
  { id: 3, label: "Level 1-3" },
  { id: 4, label: "Level 1-4" },
  { id: 5, label: "Level 1-5" },
  { id: 6, label: "Level 1-6" },
  { id: 7, label: "Level 1-7" },
  { id: 8, label: "Level 1-8" },
];

export const submenusItemsWithIcons = [
  { id: 1, label: "Level 1-1", icon: "galaxy" },
  {
    id: 2,
    label: "Level 1-2",
    icon: "galaxy",
    childItems: [
      { id: 21, label: "Level 2-1", icon: "galaxy" },
      {
        id: 22,
        label: "Level 2-2",
        icon: "galaxy",
      },
    ],
  },
  { id: 3, label: "Level 1-3", icon: "galaxy" },
  { id: 4, label: "Level 1-4", icon: "galaxy" },
];
