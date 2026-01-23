package com.appsmith.server.themes.importable;

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
import com.appsmith.server.themes.base.ThemeService;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

public class ThemeImportableServiceCEImpl implements ImportableServiceCE<Theme> {

    private final ThemeService themeService;
    private final ThemeRepository repository;

    public ThemeImportableServiceCEImpl(ThemeService themeService, ThemeRepository repository) {
        this.themeService = themeService;
        this.repository = repository;
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
     * In that case, we'll import the edit mode theme from the JSON file and update the application.
     * If the destination application already has a theme, it means we're doing any of these Git operations -
     * pull, merge, discard. In this case, we'll decide based on this decision tree:
     * - If current theme is system theme, create/get a theme as per source theme
     * - If current theme is custom and source is system, set the current theme to system (old custom theme is archived only if not used by published mode)
     * - If current theme is custom and source is also custom:
     *   - If edit and published share the same theme, create a NEW theme for edit mode (to keep published untouched)
     *   - If edit and published are different themes, update the existing edit theme in place
     *
     * @param artifactExchangeJson ApplicationJSON from file or Git
     * @return Updated application that has editModeThemeId set
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
            Mono<Theme> editModeThemeMono = importThemeFromJSON(
                    importableArtifact,
                    importableArtifact.getUnpublishedThemeId(),
                    importableArtifact.getPublishedThemeId(),
                    artifactExchangeJson.getUnpublishedTheme());

            return editModeThemeMono
                    .doOnNext(editModeTheme -> {
                        // Set the theme ID on the artifact. The artifact will be saved later in the import flow.
                        importableArtifact.setUnpublishedThemeId(editModeTheme.getId());
                    })
                    .then();
        });
    }

    /**
     * Imports a theme from JSON by either creating a new theme or updating an existing one.
     * Themes are saved directly to the database without using dry operations.
     *
     * @param destinationArtifact The application where the theme will be imported
     * @param existingThemeId     The ID of the existing unpublished theme (if any)
     * @param publishedThemeId    The ID of the published theme (used to check before archiving)
     * @param themeFromJson       The theme data from the imported JSON
     * @return Mono containing the imported/updated theme
     */
    private Mono<Theme> importThemeFromJSON(
            Artifact destinationArtifact, String existingThemeId, String publishedThemeId, Theme themeFromJson) {
        // No existing theme - create a new one
        if (!StringUtils.hasLength(existingThemeId)) {
            return themeService.getOrSaveTheme(themeFromJson, (Application) destinationArtifact);
        }

        return repository
                .findById(existingThemeId)
                .defaultIfEmpty(new Theme()) // fallback when application theme is deleted
                .flatMap(existingTheme -> {
                    // Existing theme not found or is a system theme - create a new custom theme
                    if (!StringUtils.hasLength(existingTheme.getId()) || existingTheme.isSystemTheme()) {
                        return themeService.getOrSaveTheme(themeFromJson, (Application) destinationArtifact);
                    }

                    // Existing theme is custom
                    boolean isSharedWithPublishedMode = existingThemeId.equals(publishedThemeId);

                    if (themeFromJson.isSystemTheme()) {
                        // Incoming is system theme - get system theme and archive old custom theme
                        // only if it's not being used by published mode
                        return themeService
                                .getOrSaveTheme(themeFromJson, (Application) destinationArtifact)
                                .flatMap(importedTheme -> {
                                    if (!isSharedWithPublishedMode) {
                                        return repository.archive(existingTheme).thenReturn(importedTheme);
                                    }
                                    return Mono.just(importedTheme);
                                });
                    } else {
                        // Incoming is also custom theme
                        if (isSharedWithPublishedMode) {
                            // Edit and published share the same theme - create a new theme for edit mode
                            // to keep the published theme untouched
                            return themeService.getOrSaveTheme(themeFromJson, (Application) destinationArtifact);
                        } else {
                            // Edit theme is different from published - safe to update in place
                            existingTheme.setStylesheet(themeFromJson.getStylesheet());
                            existingTheme.setProperties(themeFromJson.getProperties());
                            existingTheme.setConfig(themeFromJson.getConfig());
                            existingTheme.setName(themeFromJson.getName());
                            existingTheme.setDisplayName(themeFromJson.getDisplayName());
                            return repository.save(existingTheme);
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
