export interface OptionType {
  label?: string;
  value?: string;
}

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

export const useCaseOptions: OptionTypeWithSubtext[] = [
  {
    label: "Work Project",
    value: "work project",
  },
  {
    label: "Personal Project",
    value: "personal project",
  },
];
