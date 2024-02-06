package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

public interface CustomThemeRepositoryCE extends AppsmithRepository<Theme> {
    List<Theme> getApplicationThemes(String applicationId, AclPermission aclPermission);

    List<Theme> getSystemThemes();

    Mono<Theme> getSystemThemeByName(String themeName);

    Optional<Boolean> archiveByApplicationId(String applicationId);

    Optional<Boolean> archiveDraftThemesById(String editModeThemeId, String publishedModeThemeId);
}
