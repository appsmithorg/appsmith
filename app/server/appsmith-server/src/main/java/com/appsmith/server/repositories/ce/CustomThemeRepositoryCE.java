package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Optional;
import java.util.List;

public interface CustomThemeRepositoryCE extends AppsmithRepository<Theme> {
    List<Theme> getApplicationThemes(String applicationId, AclPermission aclPermission);

    List<Theme> getSystemThemes();

    Optional<Theme> getSystemThemeByName(String themeName);

    Optional<Boolean> archiveByApplicationId(String applicationId);

    Optional<Boolean> archiveDraftThemesById(String editModeThemeId, String publishedModeThemeId);
}
