package com.appsmith.server.themes.importable;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.imports.importable.ImportableServiceCE;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.themes.base.ThemeService;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import static com.appsmith.server.acl.AclPermission.MANAGE_THEMES;

public class ThemeImportableServiceCEImpl implements ImportableServiceCE<Theme> {

    private final ThemeService themeService;
    private final ThemeRepository repository;
    private final ApplicationService applicationService;
    private final ApplicationPermission applicationPermission;

    public ThemeImportableServiceCEImpl(
            ThemeService themeService,
            ThemeRepository repository,
            ApplicationService applicationService,
            ApplicationPermission applicationPermission) {
        this.themeService = themeService;
        this.repository = repository;
        this.applicationService = applicationService;
        this.applicationPermission = applicationPermission;
    }

    @Override
    public ArtifactBasedImportableService<Theme, ?> getArtifactBasedImportableService(
            ImportingMetaDTO importingMetaDTO) {
        // We do not support themes in packages
        return null;
    }

    /**
     * This method imports a theme from a JSON file to an application. The destination application can already have
     * a theme set or not. If no theme is set, it means the application is being created from a JSON import, git import.
     * In that case, we'll import the edit mode theme and published mode theme from the JSON file and update the application.
     * If the destination application already has a theme, it means we're doing any of these Git operations -
     * pull, merge, discard. In this case, we'll decide based on this decision tree:
     * - If current theme is a customized one and source theme is also customized, replace the current theme properties with source theme properties
     * - If current theme is a customized one and source theme is system theme, set the current theme to system and delete the old one
     * - If current theme is system theme, update the current theme as per source theme
     *
     * @param artifactExchangeJson ApplicationJSON from file or Git
     * @return Updated application that has editModeThemeId and publishedModeThemeId set
     */
    @Override
    public Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends Artifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson) {
        if (Boolean.TRUE.equals(importingMetaDTO.getAppendToArtifact())) {
            // appending to existing app, theme should not change
            return Mono.empty().then();
        }
        return importableArtifactMono.flatMap(importableArtifact -> {
            Mono<Theme> editModeTheme = updateExistingAppThemeFromJSON(
                    importableArtifact,
                    importableArtifact.getUnpublishedThemeId(),
                    artifactExchangeJson.getUnpublishedTheme());

            Mono<Theme> publishedModeTheme = updateExistingAppThemeFromJSON(
                    importableArtifact,
                    importableArtifact.getPublishedThemeId(),
                    artifactExchangeJson.getPublishedTheme());

            return Mono.zip(editModeTheme, publishedModeTheme)
                    .flatMap(importedThemesTuple -> {
                        String editModeThemeId = importedThemesTuple.getT1().getId();
                        String publishedModeThemeId =
                                importedThemesTuple.getT2().getId();

                        importableArtifact.setUnpublishedThemeId(editModeThemeId);
                        importableArtifact.setPublishedThemeId(publishedModeThemeId);
                        // this will update the theme id in DB
                        return applicationService.setAppTheme(
                                importableArtifact.getId(),
                                editModeThemeId,
                                publishedModeThemeId,
                                applicationPermission.getEditPermission());
                    })
                    .then();
        });
    }

    private Mono<Theme> updateExistingAppThemeFromJSON(
            Artifact destinationArtifact, String existingThemeId, Theme themeFromJson) {
        if (!StringUtils.hasLength(existingThemeId)) {
            return themeService.getOrSaveTheme(themeFromJson, (Application) destinationArtifact);
        }

        return repository
                .findById(existingThemeId)
                .defaultIfEmpty(new Theme()) // fallback when application theme is deleted
                .flatMap(existingTheme -> {
                    if (!StringUtils.hasLength(existingTheme.getId()) || existingTheme.isSystemTheme()) {
                        return themeService.getOrSaveTheme(themeFromJson, (Application) destinationArtifact);
                    } else {
                        if (themeFromJson.isSystemTheme()) {
                            return themeService
                                    .getOrSaveTheme(themeFromJson, (Application) destinationArtifact)
                                    .flatMap(importedTheme -> {
                                        // need to delete the old existingTheme
                                        return repository
                                                .archiveById(existingThemeId)
                                                .thenReturn(importedTheme);
                                    });
                        } else {
                            return repository.updateById(existingThemeId, themeFromJson, MANAGE_THEMES);
                        }
                    }
                });
    }

    @Override
    public Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<? extends Artifact> importableArtifactMono,
            ArtifactExchangeJson artifactExchangeJson,
            boolean isContextAgnostic) {
        return importEntities(
                importingMetaDTO,
                mappedImportableResourcesDTO,
                workspaceMono,
                importableArtifactMono,
                artifactExchangeJson);
    }
}
