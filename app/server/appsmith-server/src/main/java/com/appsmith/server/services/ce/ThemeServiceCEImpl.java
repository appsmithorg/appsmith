package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.repositories.ce.ThemeRepositoryCE;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

import static com.appsmith.server.acl.AclPermission.MANAGE_APPLICATIONS;

@Slf4j
public class ThemeServiceCEImpl extends BaseService<ThemeRepositoryCE, Theme, String> implements ThemeServiceCE {

    private final ApplicationRepository applicationRepository;
    private String defaultThemeId;  // acts as a simple cache so that we don't need to fetch from DB always

    public ThemeServiceCEImpl(Scheduler scheduler, Validator validator, MongoConverter mongoConverter, ReactiveMongoTemplate reactiveMongoTemplate, ThemeRepository repository, AnalyticsService analyticsService, ApplicationRepository applicationRepository) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.applicationRepository = applicationRepository;
    }

    @Override
    public Flux<Theme> get(MultiValueMap<String, String> params) {
        return repository.getSystemThemes(); // return the list of system themes
    }

    @Override
    public Mono<Theme> create(Theme resource) {
        // user can get the list of themes under an application only
        throw new UnsupportedOperationException();
    }

    @Override
    public Mono<Theme> update(String s, Theme resource) {
        // we don't allow to update a theme by id, user can only update a theme under their application
        throw new UnsupportedOperationException();
    }

    @Override
    public Mono<Theme> getById(String s) {
        // TODO: better to add permission check
        return repository.findById(s);
    }

    @Override
    public Mono<Theme> getApplicationTheme(String applicationId, ApplicationMode applicationMode) {
        return applicationRepository.findById(applicationId, AclPermission.READ_APPLICATIONS)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId))
                )
                .flatMap(application -> {
                    String themeId = application.getEditModeThemeId();
                    if(applicationMode == ApplicationMode.PUBLISHED) {
                        themeId = application.getPublishedModeThemeId();
                    }
                    if(!StringUtils.isEmpty(themeId)) {
                        return repository.findById(themeId);
                    } else { // theme id is not present, return default theme
                        return repository.getSystemThemeByName(Theme.DEFAULT_THEME_NAME);
                    }
                });
    }

    @Override
    public Mono<Theme> updateTheme(String applicationId, Theme resource) {
        return applicationRepository.findById(applicationId, AclPermission.MANAGE_APPLICATIONS)
                .flatMap(application -> {
                    // makes sure user has permission to edit application and an application exists by this applicationId
                    // check if this application has already a customized them
                    return saveThemeForApplication(application.getEditModeThemeId(), resource, applicationId, ApplicationMode.EDIT);
                });
    }

    @Override
    public Mono<Theme> changeCurrentTheme(String newThemeId, String applicationId) {
        // set provided theme to application and return that theme object
        Mono<Theme> setAppThemeMono = applicationRepository.setAppTheme(
                applicationId, newThemeId,null, MANAGE_APPLICATIONS
        ).then(repository.findById(newThemeId));

        // in case a customized theme was set to application, we need to delete that
        return applicationRepository.findById(applicationId, AclPermission.MANAGE_APPLICATIONS)
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.APPLICATION, applicationId))
                )
                .flatMap(application -> repository.findById(application.getEditModeThemeId())
                        .defaultIfEmpty(new Theme())
                        .flatMap(currentTheme -> {
                            if (!StringUtils.isEmpty(currentTheme.getId()) && !currentTheme.isSystemTheme()) {
                                // current theme is not a system theme but customized one, delete this
                                return repository.delete(currentTheme).then(setAppThemeMono);
                            }
                            return setAppThemeMono;
                        }));
    }

    @Override
    public Mono<String> getDefaultThemeId() {
        if(StringUtils.isEmpty(defaultThemeId)) {
            return repository.getSystemThemeByName(Theme.DEFAULT_THEME_NAME).map(theme -> {
                defaultThemeId = theme.getId();
                return theme.getId();
            });
        }
        return Mono.just(defaultThemeId);
    }

    @Override
    public Mono<Theme> cloneThemeToApplication(String srcThemeId, String destApplicationId) {
        return applicationRepository.findById(destApplicationId, MANAGE_APPLICATIONS).then(
                // make sure the current user has permission to manage application
                repository.findById(srcThemeId).flatMap(theme -> {
                    if (theme.isSystemTheme()) { // it's a system theme, no need to copy
                        return Mono.just(theme);
                    } else { // it's a customized theme, create a copy and return the copy
                        theme.setId(null); // setting id to null so that save method will create a new instance
                        return repository.save(theme);
                    }
                })
        );
    }

    @Override
    public Mono<Theme> publishTheme(String editModeThemeId, String publishedThemeId, String applicationId) {
        Mono<Theme> editModeThemeMono;
        if(!StringUtils.hasLength(editModeThemeId)) { // theme id is empty, use the default theme
            editModeThemeMono = repository.getSystemThemeByName(Theme.LEGACY_THEME_NAME);
        } else { // theme id is not empty, fetch it by id
            editModeThemeMono = repository.findById(editModeThemeId);
        }

        Mono<Theme> publishThemeMono = editModeThemeMono.flatMap(editModeTheme -> {
            if (editModeTheme.isSystemTheme()) {  // system theme is set as edit mode theme
                // just set the system theme id as edit and published mode theme id to application object
                return applicationRepository.setAppTheme(
                        applicationId, editModeTheme.getId(), editModeTheme.getId(), MANAGE_APPLICATIONS
                ).thenReturn(editModeTheme);
            } else {  // a customized theme is set as edit mode theme, copy that theme for published mode
                return saveThemeForApplication(publishedThemeId, editModeTheme, applicationId, ApplicationMode.PUBLISHED);
            }
        });
        // fetch application to make sure user has permission to manage this application
        return applicationRepository.findById(applicationId, MANAGE_APPLICATIONS).then(publishThemeMono);
    }

    /**
     * Creates a new theme if Theme with provided themeId is a system theme.
     * It sets the properties from the provided theme resource to the existing or newly created theme.
     * It'll also update the application if a new theme was created.
     * @param themeId ID of the existing theme that might be updated
     * @param resource new theme DTO that'll be stored as a new theme or override the existing theme
     * @param applicationId Application that contains the theme
     * @param applicationMode In which mode this theme will be set
     * @return Updated or newly created theme Publisher
     */
    private Mono<Theme> saveThemeForApplication(String themeId, Theme resource, String applicationId, ApplicationMode applicationMode) {
        return repository.findById(themeId)
                .flatMap(theme -> {
                    // set the edit mode values to published mode theme
                    theme.setConfig(resource.getConfig());
                    theme.setStylesheet(resource.getStylesheet());
                    theme.setProperties(resource.getProperties());
                    theme.setName(resource.getName());
                    boolean newThemeCreated = false;
                    if (theme.isSystemTheme()) {
                        // if this is a system theme, create a new one
                        theme.setId(null); // setting id to null will create a new theme
                        theme.setSystemTheme(false);
                        newThemeCreated = true;
                    }
                    return repository.save(theme).zipWith(Mono.just(newThemeCreated));
                }).flatMap(savedThemeTuple -> {
                    Theme theme = savedThemeTuple.getT1();
                    if (savedThemeTuple.getT2()) { // new published theme created, update the application
                        if(applicationMode == ApplicationMode.EDIT) {
                            return applicationRepository.setAppTheme(
                                    applicationId, theme.getId(), null, MANAGE_APPLICATIONS
                            ).thenReturn(theme);
                        } else {
                            return applicationRepository.setAppTheme(
                                    applicationId, null, theme.getId(), MANAGE_APPLICATIONS
                            ).thenReturn(theme);
                        }
                    } else {
                        return Mono.just(theme); // old theme overwritten, no need to update application
                    }
                });
    }

    @Override
    public void resetDefaultThemeIdCache() {
        defaultThemeId = null;
    }
}
