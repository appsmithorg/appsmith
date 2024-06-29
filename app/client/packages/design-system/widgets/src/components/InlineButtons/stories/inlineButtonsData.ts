import type { InlineButtonsItem } from "../src";

export const itemList: InlineButtonsItem[] = [
  { id: 1, label: "Aerospace" },
  { id: 2, label: "Mechanical" },
  { id: 3, label: "Civil" },
  { id: 4, label: "Biomedical" },
];

export const semanticItemList: InlineButtonsItem[] = [
  { id: 1, label: "Delete", color: "negative" },
  { id: 3, label: "Cancel", variant: "outlined" },
  { id: 4, label: "Save Changes" },
];

export const longItemList: InlineButtonsItem[] = [
  { id: 1, label: "Aerospace" },
  { id: 2, label: "Mechanical" },
  { id: 3, label: "Civil" },
  { id: 4, label: "Biomedical" },
  { id: 5, label: "Nuclear" },
  { id: 6, label: "Industrial" },
];

export const itemListWithIcons: InlineButtonsItem[] = [
  { id: 1, label: "Aerospace", icon: "galaxy" },
  { id: 2, label: "Mechanical", icon: "automatic-gearbox" },
  { id: 3, label: "Civil", icon: "circuit-ground" },
  { id: 4, label: "Biomedical", icon: "biohazard" },
];
