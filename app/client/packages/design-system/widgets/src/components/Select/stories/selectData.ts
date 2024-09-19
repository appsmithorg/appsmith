import type { FieldListPopoverItem } from "@appsmith/wds";

export const selectItems: FieldListPopoverItem[] = [
  { id: 1, label: "Aerospace" },
  {
    id: 2,
    label: "Mechanical",
  },
  { id: 3, label: "Civil" },
  { id: 4, label: "Biomedical" },
  { id: 5, label: "Nuclear" },
  { id: 6, label: "Industrial" },
  { id: 7, label: "Chemical" },
  { id: 8, label: "Agricultural" },
  { id: 9, label: "Electrical" },
];

export const selectItemsWithIcons: FieldListPopoverItem[] = [
  { id: 1, label: "Aerospace", icon: "galaxy" },
  {
    id: 2,
    label: "Mechanical",
    icon: "automatic-gearbox",
  },
  { id: 3, label: "Civil", icon: "circuit-ground" },
  { id: 4, label: "Biomedical", icon: "biohazard" },
  { id: 5, label: "Nuclear", icon: "atom" },
];
