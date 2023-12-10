package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.appsmith.server.dtos.*;
import com.appsmith.server.projections.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;

@Component
@RequiredArgsConstructor
public class ThemeRepositoryCake {
    private final ThemeRepository repository;

    // From CrudRepository
    public Mono<Theme> save(Theme entity) {
        return Mono.justOrEmpty(repository.save(entity));
    }

    public Flux<Theme> saveAll(Iterable<Theme> entities) {
        return Flux.fromIterable(repository.saveAll(entities));
    }

    public Mono<Theme> findById(String id) {
        return Mono.justOrEmpty(repository.findById(id));
    }
    // End from CrudRepository

    public Flux<Theme> getSystemThemes() {
        return Flux.defer(() -> Flux.fromIterable(repository.getSystemThemes()));
    }

    public Flux<Theme> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission)));
    }

    public Mono<Theme> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateAndReturn(id, updateObj, permission)));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Mono<Theme> archive(Theme entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

    public Mono<Theme> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public Flux<Theme> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort)));
    }

    public Mono<Boolean> archiveDraftThemesById(String editModeThemeId, String publishedModeThemeId) {
        return Mono.defer(
                () -> Mono.justOrEmpty(repository.archiveDraftThemesById(editModeThemeId, publishedModeThemeId)));
    }

    public Mono<Theme> setUserPermissionsInObject(Theme obj) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj)));
    }

    public Mono<Theme> setUserPermissionsInObject(Theme obj, Set<String> permissionGroups) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Flux<Theme> getApplicationThemes(String applicationId, AclPermission aclPermission) {
        return Flux.defer(() -> Flux.fromIterable(repository.getApplicationThemes(applicationId, aclPermission)));
    }

    public Mono<Theme> findById(String id, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id, permission)));
    }

    public Mono<Boolean> archiveByApplicationId(String applicationId) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveByApplicationId(applicationId)));
    }

    public Flux<Theme> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission, sort)));
    }

    public Mono<Theme> getSystemThemeByName(String themeName) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.getSystemThemeByName(themeName)));
    }

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }
}
