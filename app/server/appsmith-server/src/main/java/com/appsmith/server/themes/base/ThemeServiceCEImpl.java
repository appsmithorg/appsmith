package com.appsmith.server.themes.base;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.solutions.ApplicationPermission;
import jakarta.validation.Validator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuples;

import static com.appsmith.server.acl.AclPermission.MANAGE_THEMES;
import static com.appsmith.server.acl.AclPermission.READ_THEMES;

@Slf4j
public class ThemeServiceCEImpl extends BaseService<ThemeRepository, Theme, String> implements ThemeServiceCE {

    private final ApplicationRepository applicationRepository;
    private final ApplicationService applicationService;
    private final PolicyGenerator policyGenerator;
    private final ApplicationPermission applicationPermission;
    private String defaultThemeId; // acts as a simple cache so that we don't need to fetch from DB always

    public ThemeServiceCEImpl(
            Validator validator,
            ThemeRepository repository,
            AnalyticsService analyticsService,
            ApplicationRepository applicationRepository,
            ApplicationService applicationService,
            PolicyGenerator policyGenerator,
            ApplicationPermission applicationPermission) {
        super(validator, repository, analyticsService);
        this.applicationRepository = applicationRepository;
        this.applicationService = applicationService;
        this.policyGenerator = policyGenerator;
        this.applicationPermission = applicationPermission;
    }

    @Override
    public Mono<Theme> create(Theme resource) {
        return repository.save(resource).flatMap(analyticsService::sendCreateEvent);
    }

    @Override
    public Mono<Theme> update(String s, Theme resource) {
        // we don't allow to update a theme by id, user can only update a theme under their application
        throw new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION);
    }

    @Override
    public Mono<Theme> getByIdWithoutPermissionCheck(String s) {
        // we don't allow to get a theme by id from DB
        throw new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION);
    }

    @Override
    public Mono<Theme> getApplicationTheme(String applicationId, ApplicationMode applicationMode, String branchName) {
        return applicationService
                .findByBranchNameAndBaseApplicationId(
                        branchName, applicationId, applicationPermission.getReadPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)))
                .flatMap(application -> {
                    String themeId = application.getEditModeThemeId();
                    if (applicationMode == ApplicationMode.PUBLISHED) {
                        themeId = application.getPublishedModeThemeId();
                    }
                    if (StringUtils.hasLength(themeId)) {
                        return repository
                                .findById(themeId, READ_THEMES)
                                .switchIfEmpty(repository.getSystemThemeByName(Theme.DEFAULT_THEME_NAME, READ_THEMES));
                    } else { // theme id is not present, return default theme
                        return repository.getSystemThemeByName(Theme.DEFAULT_THEME_NAME, READ_THEMES);
                    }
                });
    }

    @Override
    public Mono<Theme> getApplicationTheme(String branchedApplicationId, ApplicationMode applicationMode) {
        return applicationService
                .findById(branchedApplicationId, applicationPermission.getReadPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.APPLICATION, branchedApplicationId)))
                .flatMap(application -> {
                    String themeId = application.getEditModeThemeId();
                    if (applicationMode == ApplicationMode.PUBLISHED) {
                        themeId = application.getPublishedModeThemeId();
                    }
                    if (StringUtils.hasLength(themeId)) {
                        return repository
                                .findById(themeId, READ_THEMES)
                                .switchIfEmpty(repository.getSystemThemeByName(Theme.DEFAULT_THEME_NAME, READ_THEMES));
                    } else { // theme id is not present, return default theme
                        return repository.getSystemThemeByName(Theme.DEFAULT_THEME_NAME, READ_THEMES);
                    }
                });
    }

    @Override
    public Flux<Theme> getApplicationThemes(String applicationId, String branchName) {
        return applicationService
                .findByBranchNameAndBaseApplicationId(
                        branchName, applicationId, applicationPermission.getReadPermission())
                .flatMapMany(application -> repository.getApplicationThemes(application.getId(), READ_THEMES));
    }

    @Override
    public Flux<Theme> getApplicationThemes(String branchedApplicationId) {
        return applicationService
                .findById(branchedApplicationId, applicationPermission.getReadPermission())
                .flatMapMany(application -> repository.getApplicationThemes(application.getId(), READ_THEMES));
    }

    @Override
    public Flux<Theme> getSystemThemes() {
        return repository.getSystemThemes(READ_THEMES);
    }

    @Override
    public Mono<Theme> updateTheme(String branchedApplicationId, Theme resource) {
        return applicationService
                .findById(branchedApplicationId, applicationPermission.getEditPermission())
                .flatMap(application -> {
                    // makes sure user has permission to edit application and an application exists by this
                    // applicationId
                    // check if this application has already a customized theme
                    return saveThemeForApplication(
                            application.getEditModeThemeId(), resource, application, ApplicationMode.EDIT);
                });
    }

    @Override
    public Mono<Theme> changeCurrentTheme(String newThemeId, String branchedApplicationId) {
        return applicationService
                .findById(branchedApplicationId, applicationPermission.getEditPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, branchedApplicationId)))
                .flatMap(application -> repository
                        .findById(application.getEditModeThemeId(), READ_THEMES)
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
                                        application.getPolicies(), Application.class, Theme.class));
                                saveThemeMono = repository.save(newTheme);
                            } else {
                                saveThemeMono = Mono.just(newTheme);
                            }

                            return saveThemeMono
                                    .flatMap(savedTheme -> {
                                        if (StringUtils.hasLength(currentTheme.getId())
                                                && !currentTheme.isSystemTheme()
                                                && !StringUtils.hasLength(currentTheme.getApplicationId())) {
                                            // current theme is neither a system theme nor app theme, delete the user
                                            // customizations
                                            return repository
                                                    .delete(currentTheme)
                                                    .then(applicationRepository.updateAppTheme(
                                                            application.getId(),
                                                            savedTheme.getId(),
                                                            null,
                                                            applicationPermission.getEditPermission()))
                                                    .thenReturn(savedTheme);
                                        } else {
                                            return applicationRepository
                                                    .updateAppTheme(
                                                            application.getId(),
                                                            savedTheme.getId(),
                                                            null,
                                                            applicationPermission.getEditPermission())
                                                    .thenReturn(savedTheme);
                                        }
                                    })
                                    .flatMap(savedTheme ->
                                            analyticsService.sendObjectEvent(AnalyticsEvents.APPLY, savedTheme));
                        }));
    }

    @Override
    public Mono<String> getDefaultThemeId() {
        if (StringUtils.isEmpty(defaultThemeId)) {
            return repository
                    .getSystemThemeByName(Theme.DEFAULT_THEME_NAME, READ_THEMES)
                    .map(theme -> {
                        defaultThemeId = theme.getId();
                        return theme.getId();
                    });
        }
        return Mono.just(defaultThemeId);
    }

    @Override
    public Mono<Theme> cloneThemeToApplication(String srcThemeId, Application destApplication) {
        return repository.findById(srcThemeId, READ_THEMES).flatMap(theme -> {
            if (theme.isSystemTheme()) { // it's a system theme, no need to copy
                return Mono.just(theme);
            } else { // it's a customized theme, create a copy and return the copy
                theme.setId(null); // setting id to null so that save method will create a new instance
                theme.setApplicationId(null);
                theme.setWorkspaceId(null);
                theme.setPolicies(policyGenerator.getAllChildPolicies(
                        destApplication.getPolicies(), Application.class, Theme.class));
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
        return applicationRepository
                .findById(applicationId, applicationPermission.getEditPermission())
                .flatMap(application -> {
                    Mono<Theme> editModeThemeMono;
                    if (!StringUtils.hasLength(
                            application.getEditModeThemeId())) { // theme id is empty, use the default theme
                        editModeThemeMono = repository.getSystemThemeByName(Theme.LEGACY_THEME_NAME, READ_THEMES);
                    } else { // theme id is not empty, fetch it by id
                        editModeThemeMono = repository.findById(application.getEditModeThemeId(), READ_THEMES);
                    }

                    return editModeThemeMono.flatMap(editModeTheme -> {
                        if (editModeTheme.isSystemTheme()) { // system theme is set as edit mode theme
                            // Delete published mode theme if it was a copy of custom theme
                            return deletePublishedCustomizedThemeCopy(application.getPublishedModeThemeId())
                                    .then(
                                            // Set the system theme id as edit and published mode theme id to
                                            // application object
                                            applicationRepository.updateAppTheme(
                                                    applicationId,
                                                    editModeTheme.getId(),
                                                    editModeTheme.getId(),
                                                    applicationPermission.getEditPermission()))
                                    .thenReturn(editModeTheme);
                        } else { // a customized theme is set as edit mode theme, copy that theme for published mode
                            return saveThemeForApplication(
                                    application.getPublishedModeThemeId(),
                                    editModeTheme,
                                    application,
                                    ApplicationMode.PUBLISHED);
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
    private Mono<Theme> saveThemeForApplication(
            String currentThemeId,
            Theme targetThemeResource,
            Application application,
            ApplicationMode applicationMode) {
        return repository
                .findById(currentThemeId, READ_THEMES)
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
                                application.getPolicies(), Application.class, Theme.class));
                        // Not setting the application id in the theme because only the named themes have an application
                        // id
                        newThemeCreated = true;
                    }
                    return repository.save(currentTheme).zipWith(Mono.just(newThemeCreated));
                })
                .flatMap(savedThemeTuple -> {
                    Theme theme = savedThemeTuple.getT1();
                    if (savedThemeTuple.getT2()) { // new theme created, update the application
                        if (applicationMode == ApplicationMode.EDIT) {
                            return applicationRepository
                                    .updateAppTheme(
                                            application.getId(),
                                            theme.getId(),
                                            null,
                                            applicationPermission.getEditPermission())
                                    .then(analyticsService.sendUpdateEvent(theme))
                                    .then(analyticsService.sendUpdateEvent(application))
                                    .thenReturn(theme);
                        } else {
                            return applicationRepository
                                    .updateAppTheme(
                                            application.getId(),
                                            null,
                                            theme.getId(),
                                            applicationPermission.getEditPermission())
                                    .thenReturn(theme);
                        }
                    } else {
                        return Mono.just(theme); // old theme overwritten, no need to update application
                    }
                });
    }

    @Override
    public Mono<Theme> persistCurrentTheme(String applicationId, String branchName, Theme resource) {

        return applicationService
                .findByBranchNameAndBaseApplicationId(
                        branchName, applicationId, applicationPermission.getEditPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId)))
                .flatMap(application -> {
                    String themeId = application.getEditModeThemeId();
                    if (!StringUtils.hasLength(themeId)) { // theme id is not present, raise error
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    } else {
                        return repository.findById(themeId, READ_THEMES).map(theme -> Tuples.of(theme, application));
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
                            application.getPolicies(), Application.class, Theme.class));

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
                })
                .flatMap(theme -> analyticsService.sendObjectEvent(AnalyticsEvents.FORK, theme));
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
        return repository
                .findById(themeId, MANAGE_THEMES)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, FieldName.THEME)))
                .flatMap(theme -> {
                    if (StringUtils.hasLength(
                            theme.getApplicationId())) { // only persisted themes are allowed to be deleted
                        return repository.archive(theme);
                    } else {
                        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
                    }
                })
                .flatMap(analyticsService::sendDeleteEvent);
    }

    @Override
    public Mono<Theme> getSystemTheme(String themeName) {
        return repository.getSystemThemeByName(themeName, READ_THEMES);
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
        return repository
                .findById(id, MANAGE_THEMES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.THEME, id)))
                .flatMap(theme -> {
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
        return getOrSaveTheme(theme, destApplication, false);
    }

    @Override
    public Mono<Theme> getOrSaveTheme(Theme theme, Application destApplication, boolean isDryOps) {
        if (theme == null) { // this application was exported without theme, assign the legacy theme to it
            return repository.getSystemThemeByName(Theme.LEGACY_THEME_NAME, READ_THEMES); // return the default theme
        } else if (theme.isSystemTheme()) {
            return repository
                    .getSystemThemeByName(theme.getName(), READ_THEMES)
                    .switchIfEmpty(repository.getSystemThemeByName(Theme.DEFAULT_THEME_NAME, READ_THEMES));
        } else {
            // create a new theme
            Theme newTheme = new Theme();
            newTheme.setPolicies(
                    policyGenerator.getAllChildPolicies(destApplication.getPolicies(), Application.class, Theme.class));
            newTheme.setStylesheet(theme.getStylesheet());
            newTheme.setProperties(theme.getProperties());
            newTheme.setConfig(theme.getConfig());
            newTheme.setName(theme.getName());
            newTheme.setDisplayName(theme.getDisplayName());
            newTheme.setSystemTheme(false);
            if (isDryOps) {
                newTheme.updateForBulkWriteOperation();
                return Mono.just(newTheme);
            }
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
        return repository
                .archiveByApplicationId(application.getId(), MANAGE_THEMES)
                .then(repository.archiveDraftThemesById(
                        application.getEditModeThemeId(), application.getPublishedModeThemeId(), MANAGE_THEMES))
                .thenReturn(application);
    }
}
