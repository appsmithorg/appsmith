package com.appsmith.server.repositories;

import com.appsmith.server.domains.Theme;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomThemeRepository extends AppsmithRepository<Theme> {
    Flux<Theme> getApplicationThemes(String applicationId);
    Mono<Theme> findByIdAndApplicationId(String themeId, String applicationId);
}
