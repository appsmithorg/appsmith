package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.appsmith.server.dtos.*;
import com.appsmith.server.projections.*;
import com.appsmith.external.models.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.data.domain.Sort;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import org.springframework.data.mongodb.core.query.*;
import com.mongodb.bulk.BulkWriteResult;
import com.mongodb.client.result.InsertManyResult;
import com.querydsl.core.types.dsl.StringPath;


import java.util.*;

@Component
@RequiredArgsConstructor
public class ThemeRepositoryCake {
    private final ThemeRepository repository;

    // From CrudRepository
    public Mono<Theme> save(Theme entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.save(entity)));
    }
    public Flux<Theme> saveAll(Iterable<Theme> entities) {
        return Flux.defer(() -> Flux.fromIterable(repository.saveAll(entities)));
    }
    public Mono<Theme> findById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id)));
    }
    // End from CrudRepository

    public boolean archiveById(String id) {
        return repository.archiveById(id);
    }

    public Mono<Theme> retrieveById(String id) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.retrieveById(id)));
    }

    public Flux<Theme> getApplicationThemes(String applicationId, AclPermission aclPermission) {
        return Flux.defer(() -> Flux.fromIterable(repository.getApplicationThemes(applicationId, aclPermission)));
    }

    public Flux<Theme> getSystemThemes() {
        return Flux.defer(() -> Flux.fromIterable(repository.getSystemThemes()));
    }

    public Mono<Boolean> archiveDraftThemesById(String editModeThemeId, String publishedModeThemeId) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveDraftThemesById(editModeThemeId, publishedModeThemeId)));
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveAllById(ids)));
    }

    public Flux<Theme> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission)));
    }

    public Flux<Theme> queryAll(List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort)));
    }

    public Mono<Theme> setUserPermissionsInObject(Theme obj, Set<String> permissionGroups) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj, permissionGroups)));
    }

    public Mono<Theme> setUserPermissionsInObject(Theme obj) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.setUserPermissionsInObject(obj)));
    }

    public Mono<Theme> updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.updateAndReturn(id, updateObj, permission)));
    }

    public Mono<Theme> getSystemThemeByName(String themeName) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.getSystemThemeByName(themeName)));
    }

    public Flux<Theme> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.defer(() -> Flux.fromIterable(repository.queryAll(criterias, permission, sort)));
    }

    public Mono<Boolean> archiveByApplicationId(String applicationId) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archiveByApplicationId(applicationId)));
    }

    public Mono<Theme> findById(String id, AclPermission permission) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.findById(id, permission)));
    }

    public Mono<Theme> archive(Theme entity) {
        return Mono.defer(() -> Mono.justOrEmpty(repository.archive(entity)));
    }

}
