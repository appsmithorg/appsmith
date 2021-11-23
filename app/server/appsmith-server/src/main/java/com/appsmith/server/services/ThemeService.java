package com.appsmith.server.services;

import com.appsmith.server.domains.Theme;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ThemeService extends CrudService<Theme, String> {
    Mono<List<Theme>> getApplicationThemes(String applicationId);
    Mono<Theme> updateTheme(String themeId, String applicationId, Theme resource);
    Mono<Theme> createTheme(String applicationId, Theme resource);
}
