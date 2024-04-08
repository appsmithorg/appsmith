package com.appsmith.server.themes.exportable;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ExportingMetaDTO;
import com.appsmith.server.dtos.MappedExportableResourcesDTO;
import com.appsmith.server.exports.exportable.ExportableServiceCE;
import com.appsmith.server.exports.exportable.artifactbased.ArtifactBasedExportableService;
import com.appsmith.server.themes.base.ThemeService;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

import java.util.List;

import static com.appsmith.server.acl.AclPermission.READ_THEMES;

@Slf4j
public class ThemeExportableServiceCEImpl implements ExportableServiceCE<Theme> {

    private final ThemeService themeService;

    public ThemeExportableServiceCEImpl(ThemeService themeService) {
        this.themeService = themeService;
    }

    @Override
    public ArtifactBasedExportableService<Theme, ?> getArtifactBasedExportableService(
            ExportingMetaDTO exportingMetaDTO) {
        // There is no specific database activity required for this resource
        return null;
    }

    // Directly sets required theme information in application json
    @Override
    public Mono<Void> getExportableEntities(
            ExportingMetaDTO exportingMetaDTO,
            MappedExportableResourcesDTO mappedExportableResourcesDTO,
            Mono<? extends Artifact> exportableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {

        Mono<Theme> defaultThemeMono = themeService
                .getSystemTheme(Theme.DEFAULT_THEME_NAME)
                .map(theme -> {
                    log.debug("Default theme found: {}", theme.getName());
                    return theme;
                })
                .cache();

        return exportableArtifactMono
                .map(artifact -> (Application) artifact)
                .flatMap(application -> themeService
                        .getThemeById(application.getUnpublishedThemeId(), READ_THEMES)
                        .switchIfEmpty(Mono.defer(() -> defaultThemeMono)) // setting default theme if theme is missing
                        .zipWith(
                                themeService
                                        .getThemeById(application.getPublishedModeThemeId(), READ_THEMES)
                                        .switchIfEmpty(Mono.defer(
                                                () -> defaultThemeMono)) // setting default theme if theme is missing
                                )
                        .map(themesTuple -> {
                            Theme editModeTheme = themesTuple.getT1();
                            Theme publishedModeTheme = themesTuple.getT2();
                            editModeTheme.sanitiseToExportDBObject();
                            publishedModeTheme.sanitiseToExportDBObject();
                            artifactExchangeJson.setThemes(editModeTheme, publishedModeTheme);
                            return List.of(themesTuple.getT1(), themesTuple.getT2());
                        }))
                .then();
    }
}
