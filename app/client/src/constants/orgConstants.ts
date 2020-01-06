export type OrgRole = {
  id: string;
  name: string;
  isDefault?: boolean;
};

export type Org = {
  id: string;
  name: string;
  website?: string;
};
