export interface OptionType {
  label?: string;
  value?: string;
}

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
    subtext: "I've never written code before.",
    value: "Brand New",
  },
  {
    label: "Novice",
    subtext: "Learning the ropes. Basic understanding of coding concepts.",
    value: "Novice",
  },
  {
    label: "Intermediate",
    subtext: "Can tackle moderately complex projects.",
    value: "Intermediate",
  },
  {
    label: "Advanced",
    subtext: "Mastery in development. Experienced with complex coding tasks.",
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
