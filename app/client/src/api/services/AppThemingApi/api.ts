import { api } from "api/core";
import type { AppTheme } from "entities/AppTheming";

const baseURL = "/v1";

export async function fetchThemes(applicationId: string) {
  const url = `${baseURL}/themes/applications/${applicationId}`;

  return api.get<AppTheme[]>(url);
}

export async function fetchSelected(applicationId: string, mode = "EDIT") {
  const url = `${baseURL}/themes/applications/${applicationId}/current`;

  return api.get<AppTheme[]>(url, { params: { mode } });
}

export async function updateTheme(applicationId: string, theme: AppTheme) {
  const url = `${baseURL}/themes/applications/${applicationId}`;
  const payload = {
    ...theme,
    new: undefined,
  };

  return api.put<AppTheme[]>(url, payload);
}

export async function changeTheme(applicationId: string, theme: AppTheme) {
  const url = `${baseURL}/applications/${applicationId}/themes/${theme.id}`;

  return api.patch<AppTheme[]>(url, theme);
}

export async function deleteTheme(themeId: string) {
  const url = `${baseURL}/themes/${themeId}`;

  return api.delete<AppTheme[]>(url);
}
