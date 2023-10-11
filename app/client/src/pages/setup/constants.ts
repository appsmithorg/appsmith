export type OptionType = {
  label?: string;
  value?: string;
};

export const roleOptions: OptionType[] = [
  {
    label: "Frontend (HTML/JS/React)",
    value: "frontend engineer",
  },
  {
    label: "Backend (APIs/Databases)",
    value: "backend engineer",
  },
  {
    label: "Fullstack",
    value: "fullstack engineer",
  },
  {
    label: "SQL Queries & Basic Coding",
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

type OptionTypeWithSubtext = OptionType & {
  subtext?: string;
};

export const proficiencyOptions: OptionTypeWithSubtext[] = [
  {
    label: "Brand New",
    subtext: "Just dipping my toes 🌱 (Brand new to this)",
    value: "Brand New",
  },
  {
    label: "Novice",
    subtext: "Novice (Limited to no experience)",
    value: "Novice",
  },
  {
    label: "Intermediate",
    subtext: "Intermediate (Some coding adventures)",
    value: "Intermediate",
  },
  {
    label: "Advanced",
    subtext: "Advanced (Comfortable with programming quests)",
    value: "Advanced",
  },
];

export const useCaseOptionsForNonSuperUser: OptionTypeWithSubtext[] = [
  {
    label: "Work Project",
    value: "work project",
  },
  {
    label: "Personal Project",
    value: "personal project",
  },
];
