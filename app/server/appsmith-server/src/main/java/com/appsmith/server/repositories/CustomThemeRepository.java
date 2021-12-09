package com.appsmith.server.repositories;

import com.appsmith.server.domains.Theme;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomThemeRepository extends AppsmithRepository<Theme> {
    Flux<Theme> getSystemThemes();
    Mono<Theme> getCustomizedTheme(String applicationId);
    Mono<Theme> findBySlug(String themeSlug);
}
