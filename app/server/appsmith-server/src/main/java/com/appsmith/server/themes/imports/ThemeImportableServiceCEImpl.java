package com.appsmith.server.themes.imports;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.imports.importable.ImportableServiceCE;
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
     * @param applicationJson ApplicationJSON from file or Git
     * @return Updated application that has editModeThemeId and publishedModeThemeId set
     */
    @Override
    public Mono<Void> importEntities(
            ImportingMetaDTO importingMetaDTO,
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Mono<Workspace> workspaceMono,
            Mono<Application> applicationMono,
            ApplicationJson applicationJson,
            boolean isPartialImport) {
        if (Boolean.TRUE.equals(importingMetaDTO.getAppendToApp())) {
            // appending to existing app, theme should not change
            return Mono.empty().then();
        }
        return applicationMono.flatMap(destinationApp -> {
            Mono<Theme> editModeTheme = updateExistingAppThemeFromJSON(
                    destinationApp, destinationApp.getEditModeThemeId(), applicationJson.getEditModeTheme());

            Mono<Theme> publishedModeTheme = updateExistingAppThemeFromJSON(
                    destinationApp, destinationApp.getPublishedModeThemeId(), applicationJson.getPublishedTheme());

            return Mono.zip(editModeTheme, publishedModeTheme)
                    .flatMap(importedThemesTuple -> {
                        String editModeThemeId = importedThemesTuple.getT1().getId();
                        String publishedModeThemeId =
                                importedThemesTuple.getT2().getId();

                        destinationApp.setEditModeThemeId(editModeThemeId);
                        destinationApp.setPublishedModeThemeId(publishedModeThemeId);
                        // this will update the theme id in DB
                        return applicationService.setAppTheme(
                                destinationApp.getId(),
                                editModeThemeId,
                                publishedModeThemeId,
                                applicationPermission.getEditPermission());
                    })
                    .then();
        });
    }

    private Mono<Theme> updateExistingAppThemeFromJSON(
            Application destinationApp, String existingThemeId, Theme themeFromJson) {
        if (!StringUtils.hasLength(existingThemeId)) {
            return themeService.getOrSaveTheme(themeFromJson, destinationApp);
        }

        return repository
                .findById(existingThemeId)
                .defaultIfEmpty(new Theme()) // fallback when application theme is deleted
                .flatMap(existingTheme -> {
                    if (!StringUtils.hasLength(existingTheme.getId()) || existingTheme.isSystemTheme()) {
                        return themeService.getOrSaveTheme(themeFromJson, destinationApp);
                    } else {
                        if (themeFromJson.isSystemTheme()) {
                            return themeService
                                    .getOrSaveTheme(themeFromJson, destinationApp)
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
}
