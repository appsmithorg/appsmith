export type OptionType = {
  label?: string;
  value?: string;
};

export const roleOptions: OptionType[] = [
  {
    label: "Engineer",
    value: "engineer",
  },
  {
    label: "Product manager",
    value: "product manager",
  },
  {
    label: "Founder",
    value: "founder",
  },
  {
    label: "Operations",
    value: "operations",
  },
  {
    label: "Business Analyst",
    value: "business analyst",
  },
  {
    label: "Other",
    value: "other",
  },
];

export const useCaseOptions: OptionType[] = [
  {
    label: "Just Exploring",
    value: "just exploring",
  },
  {
    label: "Personal Project",
    value: "personal project",
  },
  {
    label: "Work Project",
    value: "work project",
  },
  {
    label: "Other",
    value: "other",
  },
];
