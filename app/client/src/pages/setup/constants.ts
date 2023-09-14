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

export const proficiencyOptions = [
  {
    label: "Just dipping my toes 🌱 (Brand new to this)",
    value: "Beginner",
  },
  { label: "Novice (Limited to no experience)", value: "Novice" },
  { label: "Intermediate (Some coding adventures)", value: "Intermediate" },
  {
    label: "Advanced (Comfortable with programming quests)",
    value: "Advanced",
  },
];
