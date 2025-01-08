export interface TemplatesReduxState {
  isImportingTemplate: boolean;
  isImportingTemplateToOrg: boolean;
  templateId: string;
  templateWorkspaceId: string;
  workspaceId: string;
  templateTitle: string;
  templatePage: any; // TODO: Add proper type for template page
  filters: any; // TODO: Add proper type for filters
}
