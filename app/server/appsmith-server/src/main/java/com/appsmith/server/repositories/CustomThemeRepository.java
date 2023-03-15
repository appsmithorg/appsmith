package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.repositories.ce.CustomThemeRepositoryCE;
import reactor.core.publisher.Flux;

import java.util.Optional;

public interface CustomThemeRepository extends CustomThemeRepositoryCE {
    Flux<Theme> getPersistedThemesForApplication(String applicationId, Optional<AclPermission> aclPermission);

}
