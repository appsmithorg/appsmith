export type OptionType = {
  label?: string;
  value?: string;
};

export const roleOptions: OptionType[] = [
  {
    label: "Frontend Engineer",
    value: "frontend engineer",
  },
  {
    label: "Backend Engineer",
    value: "backend engineer",
  },
  {
    label: "Fullstack Engineer",
    value: "fullstack engineer",
  },
  {
    label: "Business Analyst",
    value: "business analyst",
  },
  {
    label: "Non Technical",
    value: "non technical",
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
