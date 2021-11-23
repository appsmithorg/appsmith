package com.appsmith.server.repositories;

import com.appsmith.server.domains.Theme;
import reactor.core.publisher.Flux;

public interface CustomThemeRepository extends AppsmithRepository<Theme> {
    Flux<Theme> getApplicationThemes(String applicationId);
}
