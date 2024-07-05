package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.List;
import java.util.Optional;

public interface CustomThemeRepositoryCE extends AppsmithRepository<Theme> {
    List<Theme> getApplicationThemes(String applicationId, AclPermission permission, User currentUser);

    List<Theme> getSystemThemes();

    Optional<Theme> getSystemThemeByName(String themeName, AclPermission permission, User currentUser);

    Optional<Theme> getSystemThemeByName(String themeName);

    Optional<Boolean> archiveByApplicationId(String applicationId, AclPermission permission, User currentUser);

    Optional<Boolean> archiveDraftThemesById(
            String editModeThemeId, String publishedModeThemeId, AclPermission permission, User currentUser);
}
