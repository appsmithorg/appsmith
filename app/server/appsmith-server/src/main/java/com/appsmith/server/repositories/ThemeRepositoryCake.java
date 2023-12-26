package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.appsmith.server.projections.*;
import com.appsmith.server.repositories.cakes.BaseCake;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Component
public class ThemeRepositoryCake extends BaseCake<Theme> {
    private final ThemeRepository repository;

    public ThemeRepositoryCake(ThemeRepository repository) {
        super(repository);
        this.repository = repository;
    }

    // From CrudRepository
    public Flux<Theme> saveAll(Iterable<Theme> entities) {
        return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
    }

    public Mono<Theme> findById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
    }
    // End from CrudRepository

    public Flux<Theme> getApplicationThemes(String applicationId, AclPermission aclPermission) {
        return Flux.defer(() -> Flux.fromIterable(repository.getApplicationThemes(applicationId, aclPermission)));
    }

    public Flux<Theme> getSystemThemes() {
        return Flux.defer(() -> Flux.fromIterable(repository.getSystemThemes()));
    }

    public Flux<Theme> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission)));
    }

    public Flux<Theme> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission, sort)));
    }

    public Flux<Theme> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort)));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<Boolean> archiveByApplicationId(String applicationId) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveByApplicationId(applicationId)));
    }

    public Mono<Boolean> archiveDraftThemesById(String editModeThemeId, String publishedModeThemeId) {
        return Mono.defer(
                () -> Mono.justOrEmpty(repository.archiveDraftThemesById(editModeThemeId, publishedModeThemeId)));
    }

    public Mono<Theme> archive(Theme entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Mono<Theme> findById(String id, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id, permission)));
    }

    public Mono<Theme> getSystemThemeByName(String themeName) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.getSystemThemeByName(themeName)));
    }

    public Mono<Theme> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public Mono<Theme> setUserPermissionsInObject(Theme obj) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj)));
    }

    public Mono<Theme> setUserPermissionsInObject(Theme obj, Set<String> permissionGroups) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Mono<Theme> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateAndReturn(id, updateObj, permission)));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }
}
