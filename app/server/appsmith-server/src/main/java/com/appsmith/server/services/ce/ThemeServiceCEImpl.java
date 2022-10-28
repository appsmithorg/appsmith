package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.repositories.ce.ThemeRepositoryCE;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.BaseService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.util.function.Tuples;

import javax.validation.Validator;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.MANAGE_THEMES;
import static com.appsmith.server.acl.AclPermission.READ_APPLICATIONS;
import static com.appsmith.server.acl.AclPermission.READ_THEMES;

@Slf4j
public class ThemeServiceCEImpl extends BaseService<ThemeRepositoryCE, Theme, String> implements ThemeServiceCE {

    private final ApplicationRepository applicationRepository;
    private final ApplicationService applicationService;
    private final PolicyGenerator policyGenerator;
    private String defaultThemeId;  // acts as a simple cache so that we don't need to fetch from DB always

    public ThemeServiceCEImpl(Scheduler scheduler, Validator validator, MongoConverter mongoConverter, ReactiveMongoTemplate reactiveMongoTemplate, ThemeRepository repository, AnalyticsService analyticsService, ApplicationRepository applicationRepository, ApplicationService applicationService, PolicyGenerator policyGenerator) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.applicationRepository = applicationRepository;
        this.applicationService = applicationService;
        this.policyGenerator = policyGenerator;
    }

    @Override
    public Mono<Theme> create(Theme resource) {
        return repository.save(resource)
                .flatMap(analyticsService::sendCreateEvent);
    }

    @Override
    public Mono<Theme> update(String s, Theme resource) {
        // we don't allow to update a theme by id, user can only update a theme under their application
        throw new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION);
    }

    @Override
    public Mono<Theme> getById(String s) {
        // we don't allow to get a theme by id from DB
        throw new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION);
    }

    @Override
    public Flux<Theme> get(MultiValueMap<String, String> params) {
        // we return all system themes
        return repository.getSystemThemes();
    }

    @Override
    public Mono<Theme> getApplicationTheme(String applicationId, ApplicationMode applicationMode, String branchName) {
        return applicationService.findByBranchNameAndDefaultApplicationId(branchName, applicationId, READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId))
                )
                .flatMap(application -> {
                    String themeId = application.getEditModeThemeId();
                    if (applicationMode == ApplicationMode.PUBLISHED) {
                        themeId = application.getPublishedModeThemeId();
                    }
                    if (StringUtils.hasLength(themeId)) {
                        return repository.findById(themeId, READ_THEMES);
                    } else { // theme id is not present, return default theme
                        return repository.getSystemThemeByName(Theme.DEFAULT_THEME_NAME);
                    }
                });
    }

    @Override
    public Flux<Theme> getApplicationThemes(String applicationId, String branchName) {
        return applicationService.findByBranchNameAndDefaultApplicationId(branchName, applicationId, READ_APPLICATIONS)
                .flatMapMany(application -> repository.getApplicationThemes(application.getId(), READ_THEMES));
    }

    @Override
    public Flux<Theme> getSystemThemes() {
        return repository.getSystemThemes();
    }

    @Override
    public Mono<Theme> updateTheme(String applicationId, String branchName, Theme resource) {
        return applicationService.findByBranchNameAndDefaultApplicationId(branchName, applicationId, MANAGE_APPLICATIONS)
                .flatMap(application -> {
                    // makes sure user has permission to edit application and an application exists by this applicationId
                    // check if this application has already a customized them
                    return saveThemeForApplication(application.getEditModeThemeId(), resource, application, ApplicationMode.EDIT);
                });
    }

    @Override
    public Mono<Theme> changeCurrentTheme(String newThemeId, String applicationId, String branchName) {
        return applicationService.findByBranchNameAndDefaultApplicationId(branchName, applicationId, MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId))
                )
                .flatMap(application -> repository.findById(application.getEditModeThemeId(), READ_THEMES)
                        .defaultIfEmpty(new Theme())
                        .zipWith(repository.findById(newThemeId, READ_THEMES))
                        .flatMap(themeTuple2 -> {
                            Theme currentTheme = themeTuple2.getT1();
                            Theme newTheme = themeTuple2.getT2();
                            Mono<Theme> saveThemeMono;
                            if (!newTheme.isSystemTheme()) {
                                // we'll create a copy of newTheme
                                newTheme.setId(null);
                                newTheme.setApplicationId(null);
                                newTheme.setWorkspaceId(null);
                                newTheme.setPolicies(policyGenerator.getAllChildPolicies(
                                        application.getPolicies(), Application.class, Theme.class
                                ));
                                saveThemeMono = repository.save(newTheme);
                            } else {
                                saveThemeMono = Mono.just(newTheme);
                            }

                            return saveThemeMono.flatMap(savedTheme -> {
                                if (StringUtils.hasLength(currentTheme.getId()) && !currentTheme.isSystemTheme()
                                        && !StringUtils.hasLength(currentTheme.getApplicationId())) {
                                    // current theme is neither a system theme nor app theme, delete the user customizations
                                    return repository.delete(currentTheme)
                                            .then(applicationRepository.setAppTheme(
                                                    application.getId(), savedTheme.getId(), null, MANAGE_APPLICATIONS
                                            ))
                                            .thenReturn(savedTheme);
                                } else {
                                    return applicationRepository.setAppTheme(
                                                    application.getId(), savedTheme.getId(), null, MANAGE_APPLICATIONS
                                            )
                                            .thenReturn(savedTheme);
                                }
                            }).flatMap(savedTheme ->
                                    analyticsService.sendObjectEvent(AnalyticsEvents.APPLY, savedTheme)
                            );
                        })
                );
    }

    @Override
    public Mono<String> getDefaultThemeId() {
        if (StringUtils.isEmpty(defaultThemeId)) {
            return repository.getSystemThemeByName(Theme.DEFAULT_THEME_NAME).map(theme -> {
                defaultThemeId = theme.getId();
                return theme.getId();
            });
        }
        return Mono.just(defaultThemeId);
    }

    @Override
    public Mono<Theme> cloneThemeToApplication(String srcThemeId, Application destApplication) {
        return repository.findById(srcThemeId, READ_THEMES)
                .flatMap(theme -> {
                    if (theme.isSystemTheme()) { // it's a system theme, no need to copy
                        return Mono.just(theme);
                    } else { // it's a customized theme, create a copy and return the copy
                        theme.setId(null); // setting id to null so that save method will create a new instance
                        theme.setApplicationId(null);
                        theme.setWorkspaceId(null);
                        theme.setPolicies(policyGenerator.getAllChildPolicies(
                                destApplication.getPolicies(), Application.class, Theme.class
                        ));
                        return repository.save(theme);
                    }
                });
    }

    /**
     * Publishes a theme from edit mode to published mode
     *
     * @param applicationId application id
     * @return Mono of theme object that was set in published mode
     */
    @Override
    public Mono<Theme> publishTheme(String applicationId) {
        // fetch application to make sure user has permission to manage this application
        return applicationRepository.findById(applicationId, MANAGE_APPLICATIONS).flatMap(application -> {
            Mono<Theme> editModeThemeMono;
            if (!StringUtils.hasLength(application.getEditModeThemeId())) { // theme id is empty, use the default theme
                editModeThemeMono = repository.getSystemThemeByName(Theme.LEGACY_THEME_NAME);
            } else { // theme id is not empty, fetch it by id
                editModeThemeMono = repository.findById(application.getEditModeThemeId(), READ_THEMES);
            }

            return editModeThemeMono.flatMap(editModeTheme -> {
                if (editModeTheme.isSystemTheme()) {  // system theme is set as edit mode theme
                    // Delete published mode theme if it was a copy of custom theme
                    return deletePublishedCustomizedThemeCopy(application.getPublishedModeThemeId()).then(
                            // Set the system theme id as edit and published mode theme id to application object
                            applicationRepository.setAppTheme(
                                    applicationId, editModeTheme.getId(), editModeTheme.getId(), MANAGE_APPLICATIONS
                            )
                    ).thenReturn(editModeTheme);
                } else {  // a customized theme is set as edit mode theme, copy that theme for published mode
                    return saveThemeForApplication(
                            application.getPublishedModeThemeId(), editModeTheme, application, ApplicationMode.PUBLISHED
                    );
                }
            });
        });
    }

    /**
     * Creates a new theme if Theme with provided themeId is a system theme.
     * It sets the properties from the provided theme resource to the existing or newly created theme.
     * It'll also update the application if a new theme was created.
     *
     * @param currentThemeId      ID of the existing theme that might be updated
     * @param targetThemeResource new theme DTO that'll be stored as a new theme or override the existing theme
     * @param application         Application that contains the theme
     * @param applicationMode     In which mode this theme will be set
     * @return Updated or newly created theme Publisher
     */
    private Mono<Theme> saveThemeForApplication(String currentThemeId, Theme targetThemeResource, Application application, ApplicationMode applicationMode) {
        return repository.findById(currentThemeId, READ_THEMES)
                .flatMap(currentTheme -> {
                    // update the attributes of entity as per the request DTO
                    currentTheme.setConfig(targetThemeResource.getConfig());
                    currentTheme.setStylesheet(targetThemeResource.getStylesheet());
                    currentTheme.setProperties(targetThemeResource.getProperties());
                    if (StringUtils.hasLength(targetThemeResource.getName())) {
                        currentTheme.setName(targetThemeResource.getName());
                    }

                    if (StringUtils.hasLength(targetThemeResource.getDisplayName())) {
                        currentTheme.setDisplayName(targetThemeResource.getDisplayName());
                    } else {
                        currentTheme.setDisplayName(currentTheme.getName());
                    }
                    boolean newThemeCreated = false;
                    if (currentTheme.isSystemTheme()) {
                        // if this is a system theme, create a new one
                        currentTheme.setId(null); // setting id to null will create a new theme
                        currentTheme.setSystemTheme(false);
                        currentTheme.setPolicies(policyGenerator.getAllChildPolicies(
                                application.getPolicies(), Application.class, Theme.class
                        ));
                        // Not setting the application id in the theme because only the named themes have an application id
                        newThemeCreated = true;
                    }
                    return repository.save(currentTheme).zipWith(Mono.just(newThemeCreated));
                }).flatMap(savedThemeTuple -> {
                    Theme theme = savedThemeTuple.getT1();
                    if (savedThemeTuple.getT2()) { // new theme created, update the application
                        if (applicationMode == ApplicationMode.EDIT) {
                            return applicationRepository.setAppTheme(
                                    application.getId(), theme.getId(), null, MANAGE_APPLICATIONS
                            ).then(analyticsService.sendUpdateEvent(theme))
                                    .then(analyticsService.sendUpdateEvent(application))
                                    .thenReturn(theme);
                        } else {
                            return applicationRepository.setAppTheme(
                                    application.getId(), null, theme.getId(), MANAGE_APPLICATIONS
                            ).thenReturn(theme);
                        }
                    } else {
                        return Mono.just(theme); // old theme overwritten, no need to update application
                    }
                });
    }

    @Override
    public Mono<Theme> persistCurrentTheme(String applicationId, String branchName, Theme resource) {

        return applicationService.findByBranchNameAndDefaultApplicationId(branchName, applicationId, MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId))
                )
                .flatMap(application -> {
                    String themeId = application.getEditModeThemeId();
                    if (!StringUtils.hasLength(themeId)) { // theme id is not present, raise error
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    } else {
                        return repository.findById(themeId, READ_THEMES)
                                .map(theme -> Tuples.of(theme, application));
                    }
                })
                .flatMap(themeAndApplicationTuple -> {
                    Theme theme = themeAndApplicationTuple.getT1();
                    Application application = themeAndApplicationTuple.getT2();
                    theme.setId(null); // we'll create a copy so setting id to null
                    theme.setSystemTheme(false);
                    // A named theme differs from a non-named one by having an application id
                    theme.setApplicationId(application.getId());
                    theme.setWorkspaceId(application.getWorkspaceId());
                    theme.setPolicies(policyGenerator.getAllChildPolicies(
                            application.getPolicies(), Application.class, Theme.class
                    ));

                    // need to remove it when FE adapts displayName everywhere
                    if (StringUtils.hasLength(resource.getName())) {
                        theme.setName(resource.getName());
                    } else {
                        theme.setName(theme.getName() + " copy");
                    }

                    if (StringUtils.hasLength(resource.getDisplayName())) {
                        theme.setDisplayName(resource.getDisplayName());
                    } else {
                        theme.setDisplayName(theme.getName());
                    }
                    return repository.save(theme);
                }).flatMap(theme -> analyticsService.sendObjectEvent(AnalyticsEvents.FORK, theme));
    }

    /**
     * This method will fetch a theme by id and delete this if it's not a system theme.
     * When an app is published with a customized theme, we store a copy of that theme so that changes are available
     * in published mode even user has changed the theme in edit mode. When user switches back to another theme and
     * publish the application where that app was previously published with a custom theme, we should delete that copy.
     * Otherwise there'll be a lot of orphan theme copies that were set a published mode once but are used no more.
     *
     * @param themeId id of the theme that'll be deleted
     * @return deleted theme mono
     */
    private Mono<Theme> deletePublishedCustomizedThemeCopy(String themeId) {
        if (!StringUtils.hasLength(themeId)) {
            return Mono.empty();
        }
        return repository.findById(themeId).flatMap(theme -> {
            if (!theme.isSystemTheme()) {
                return repository.deleteById(themeId).thenReturn(theme);
            }
            return Mono.just(theme);
        });
    }

    @Override
    public Mono<Theme> archiveById(String themeId) {
        return repository.findById(themeId, MANAGE_THEMES)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, FieldName.THEME))
                ).flatMap(theme -> {
                    if (StringUtils.hasLength(theme.getApplicationId())) { // only persisted themes are allowed to be deleted
                        return repository.archive(theme);
                    } else {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    }
                }).flatMap(analyticsService::sendDeleteEvent);
    }

    @Override
    public Mono<Theme> getSystemTheme(String themeName) {
        return repository.getSystemThemeByName(themeName);
    }


    @Override
    public Mono<Theme> getThemeById(String themeId, AclPermission permission) {
        return repository.findById(themeId, permission);
    }

    @Override
    public Mono<Theme> save(Theme theme) {
        return repository.save(theme);
    }

    @Override
    public Mono<Theme> updateName(String id, Theme themeDto) {
        return repository.findById(id, MANAGE_THEMES)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.THEME, id))
                ).flatMap(theme -> {
                    if (StringUtils.hasLength(themeDto.getName())) {
                        theme.setName(themeDto.getName());
                    }

                    if (StringUtils.hasLength(themeDto.getDisplayName())) {
                        theme.setDisplayName(themeDto.getDisplayName());
                    }
                    return repository.save(theme);
                });
    }

    @Override
    public Mono<Theme> getOrSaveTheme(Theme theme, Application destApplication) {
        if (theme == null) { // this application was exported without theme, assign the legacy theme to it
            return repository.getSystemThemeByName(Theme.LEGACY_THEME_NAME); // return the default theme
        } else if (theme.isSystemTheme()) {
            return repository.getSystemThemeByName(theme.getName())
                    .switchIfEmpty(repository.getSystemThemeByName(Theme.DEFAULT_THEME_NAME));
        } else {
            // create a new theme
            Theme newTheme = new Theme();
            newTheme.setPolicies(policyGenerator.getAllChildPolicies(
                    destApplication.getPolicies(), Application.class, Theme.class
            ));
            newTheme.setStylesheet(theme.getStylesheet());
            newTheme.setProperties(theme.getProperties());
            newTheme.setConfig(theme.getConfig());
            newTheme.setName(theme.getName());
            newTheme.setDisplayName(theme.getDisplayName());
            newTheme.setSystemTheme(false);
            return repository.save(newTheme);
        }
    }

    /**
     * This will archive themes related to the provided Application.
     * It'll delete any theme that was saved for this application. It'll also delete the draft themes for this Application.
     *
     * @param application Application object
     * @return Provided Application publisher
     */
    @Override
    public Mono<Application> archiveApplicationThemes(Application application) {
        return repository.archiveByApplicationId(application.getId())
                .then(repository.archiveDraftThemesById(application.getEditModeThemeId(), application.getPublishedModeThemeId()))
                .thenReturn(application);
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
     * @param destinationApp Application object
     * @param sourceJson     ApplicationJSON from file or Git
     * @return Updated application that has editModeThemeId and publishedModeThemeId set
     */

    @Override
    public Mono<Application> importThemesToApplication(Application destinationApp, ApplicationJson sourceJson) {
        Mono<Theme> editModeTheme = updateExistingAppThemeFromJSON(
                destinationApp, destinationApp.getEditModeThemeId(), sourceJson.getEditModeTheme()
        );

        Mono<Theme> publishedModeTheme = updateExistingAppThemeFromJSON(
                destinationApp, destinationApp.getPublishedModeThemeId(), sourceJson.getPublishedTheme()
        );

        return Mono.zip(editModeTheme, publishedModeTheme).flatMap(importedThemesTuple -> {
            String editModeThemeId = importedThemesTuple.getT1().getId();
            String publishedModeThemeId = importedThemesTuple.getT2().getId();

            destinationApp.setEditModeThemeId(editModeThemeId);
            destinationApp.setPublishedModeThemeId(publishedModeThemeId);
            // this will update the theme id in DB
            // also returning the updated application object so that theme id are available to the next pipeline
            return applicationService.setAppTheme(
                    destinationApp.getId(), editModeThemeId, publishedModeThemeId, MANAGE_APPLICATIONS
            ).thenReturn(destinationApp);
        });
    }

    private Mono<Theme> updateExistingAppThemeFromJSON(Application destinationApp, String existingThemeId, Theme themeFromJson) {
        if (!StringUtils.hasLength(existingThemeId)) {
            return getOrSaveTheme(themeFromJson, destinationApp);
        }
        return repository.findById(existingThemeId, READ_THEMES).flatMap(existingTheme -> {
            if (existingTheme.isSystemTheme()) {
                return getOrSaveTheme(themeFromJson, destinationApp);
            } else {
                if (themeFromJson.isSystemTheme()) {
                    return getOrSaveTheme(themeFromJson, destinationApp).flatMap(importedTheme -> {
                        // need to delete the old existingTheme
                        return repository.archiveById(existingThemeId).thenReturn(importedTheme);
                    });
                } else {
                    return repository.updateById(existingThemeId, themeFromJson, MANAGE_THEMES);
                }
            }
        });
    }
}
