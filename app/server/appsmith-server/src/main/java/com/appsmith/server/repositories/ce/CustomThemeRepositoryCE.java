package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Theme;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CustomThemeRepositoryCE extends AppsmithRepository<Theme> {
    Flux<Theme> getSystemThemes();
    Mono<Theme> getSystemThemeByName(String themeName);
}
