package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomThemeRepositoryCE extends AppsmithRepository<Theme> {
    Flux<Theme> getApplicationThemes(String applicationId, AclPermission aclPermission);
    Flux<Theme> getSystemThemes();
    Mono<Theme> getSystemThemeByName(String themeName);
    Mono<Boolean> archiveByApplicationId(String applicationId);
    Mono<Boolean> archiveDraftThemesById(String editModeThemeId, String publishedModeThemeId);
}
