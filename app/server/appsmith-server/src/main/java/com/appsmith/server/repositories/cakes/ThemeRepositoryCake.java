package com.appsmith.server.repositories.cakes;

import com.appsmith.external.models.*;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ReactiveContextUtils;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.newactions.projections.*;
import com.appsmith.server.projections.*;
import com.appsmith.server.repositories.*;
import com.appsmith.server.repositories.ce.params.QueryAllParams;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.List;

import static com.appsmith.server.helpers.ReactorUtils.asFlux;
import static com.appsmith.server.helpers.ReactorUtils.asMono;

@Component
public class ThemeRepositoryCake extends BaseCake<Theme, ThemeRepository> {
    private final ThemeRepository repository;

    public ThemeRepositoryCake(ThemeRepository repository) {
        super(repository);
        this.repository = repository;
    }

    public QueryAllParams<Theme> queryBuilder() {
        return repository.queryBuilder();
    }

    // From CrudRepository
    public Flux<Theme> saveAll(Iterable<Theme> entities) {
        return asFlux(() -> repository.saveAll(entities));
    }
    // End from CrudRepository

    /** @see com.appsmith.server.repositories.ce.CustomThemeRepositoryCE#archiveByApplicationId(String, AclPermission, User) */
    public Mono<Boolean> archiveByApplicationId(String applicationId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser ->
                        asMono(() -> repository.archiveByApplicationId(applicationId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomThemeRepositoryCE#archiveDraftThemesById(String, String, AclPermission, User) */
    public Mono<Boolean> archiveDraftThemesById(
            String editModeThemeId, String publishedModeThemeId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.archiveDraftThemesById(
                        editModeThemeId, publishedModeThemeId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkInsert(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkInsert(ThemeRepositoryCake baseRepository, List<Theme> domainList) {
        return asMono(() -> repository.bulkInsert(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#bulkUpdate(BaseRepository<BaseDomain, String>, List<BaseDomain>) */
    public Mono<Void> bulkUpdate(ThemeRepositoryCake baseRepository, List<Theme> domainList) {
        return asMono(() -> repository.bulkUpdate(repository, domainList));
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findAll() */
    public Flux<Theme> findAll() {
        return asFlux(() -> repository.findAll());
    }

    /** @see com.appsmith.server.repositories.BaseRepository#findById(String) */
    public Mono<Theme> findById(String id) {
        return asMono(() -> repository.findById(id));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#findById(String, AclPermission, User) */
    public Mono<Theme> findById(String id, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.findById(id, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomThemeRepositoryCE#getApplicationThemes(String, AclPermission, User) */
    public Flux<Theme> getApplicationThemes(String applicationId, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser ->
                        asFlux(() -> repository.getApplicationThemes(applicationId, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#getById(String) */
    public Mono<Theme> getById(String id) {
        return asMono(() -> repository.getById(id));
    }

    /** @see com.appsmith.server.repositories.ce.CustomThemeRepositoryCE#getSystemThemeByName(String) */
    public Mono<Theme> getSystemThemeByName(String themeName) {
        return asMono(() -> repository.getSystemThemeByName(themeName));
    }

    /** @see com.appsmith.server.repositories.ce.CustomThemeRepositoryCE#getSystemThemeByName(String, AclPermission, User) */
    public Mono<Theme> getSystemThemeByName(String themeName, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser ->
                        asMono(() -> repository.getSystemThemeByName(themeName, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.ce.CustomThemeRepositoryCE#getSystemThemes(AclPermission, User) */
    public Flux<Theme> getSystemThemes(AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMapMany(currentUser -> asFlux(() -> repository.getSystemThemes(permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, User) */
    public Mono<Theme> setUserPermissionsInObject(Theme obj, User user) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, user))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#setUserPermissionsInObject(BaseDomain, java.util.Collection<String>) */
    public Mono<Theme> setUserPermissionsInObject(Theme obj, java.util.Collection<String> permissionGroups) {
        return Mono.fromSupplier(() -> repository.setUserPermissionsInObject(obj, permissionGroups))
                .subscribeOn(Schedulers.boundedElastic());
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateAndReturn(String, BridgeUpdate, AclPermission, User) */
    public Mono<Theme> updateAndReturn(String id, BridgeUpdate updateObj, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser().flatMap(currentUser -> Mono.fromSupplier(
                        () -> repository.updateAndReturn(id, updateObj, permission, currentUser))
                .subscribeOn(Schedulers.boundedElastic()));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateById(String, BaseDomain, AclPermission, User) */
    public Mono<Theme> updateById(String id, Theme resource, AclPermission permission) {
        return ReactiveContextUtils.getCurrentUser()
                .flatMap(currentUser -> asMono(() -> repository.updateById(id, resource, permission, currentUser)));
    }

    /** @see com.appsmith.server.repositories.AppsmithRepository#updateByIdWithoutPermissionCheck(String, BridgeUpdate) */
    public Mono<Integer> updateByIdWithoutPermissionCheck(String id, BridgeUpdate update) {
        return Mono.fromSupplier(() -> repository.updateByIdWithoutPermissionCheck(id, update))
                .subscribeOn(Schedulers.boundedElastic());
    }
}
