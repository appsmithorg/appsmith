package com.appsmith.server.repositories;

import com.appsmith.external.models.*;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.*;
import com.mongodb.client.result.UpdateResult;
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

    public Flux<Theme> queryAll(List<Criteria> criterias, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, permission, sort));
    }

    public Mono<UpdateResult> updateByIdAndFieldNames(String id, Map<String, Object> fieldNameValueMap) {
        return Mono.justOrEmpty(repository.updateByIdAndFieldNames(id, fieldNameValueMap));
    }

    public Mono<Theme> getSystemThemeByName(String themeName) {
        return Mono.justOrEmpty(repository.getSystemThemeByName(themeName));
    }

    public Theme updateAndReturn(String id, Update updateObj, Optional<AclPermission> permission) {
        return repository.updateAndReturn(id, updateObj, permission);
    }

    public Mono<Boolean> archiveByApplicationId(String applicationId) {
        return Mono.justOrEmpty(repository.archiveByApplicationId(applicationId));
    }

    public Theme setUserPermissionsInObject(Theme obj, Set<String> permissionGroups) {
        return repository.setUserPermissionsInObject(obj, permissionGroups);
    }

    public Mono<Theme> findByIdAndBranchName(String id, String branchName) {
        return Mono.justOrEmpty(repository.findByIdAndBranchName(id, branchName));
    }

    public Mono<Boolean> archiveDraftThemesById(String editModeThemeId, String publishedModeThemeId) {
        return Mono.justOrEmpty(repository.archiveDraftThemesById(editModeThemeId, publishedModeThemeId));
    }

    public Mono<Theme> findById(String id, AclPermission permission) {
        return Mono.justOrEmpty(repository.findById(id, permission));
    }

    public Flux<Theme> queryAll(
            List<Criteria> criterias, List<String> includeFields, AclPermission permission, Sort sort) {
        return Flux.fromIterable(repository.queryAll(criterias, includeFields, permission, sort));
    }

    public Flux<Theme> getSystemThemes() {
        return Flux.fromIterable(repository.getSystemThemes());
    }

    public Flux<Theme> queryAll(List<Criteria> criterias, AclPermission permission) {
        return Flux.fromIterable(repository.queryAll(criterias, permission));
    }

    public Mono<Theme> findByIdAndFieldNames(String id, List<String> fieldNames) {
        return Mono.justOrEmpty(repository.findByIdAndFieldNames(id, fieldNames));
    }

    public Mono<Boolean> archiveById(String id) {
        return Mono.justOrEmpty(repository.archiveById(id));
    }

    public Mono<Theme> retrieveById(String id) {
        return Mono.justOrEmpty(repository.retrieveById(id));
    }

    public Theme setUserPermissionsInObject(Theme obj) {
        return repository.setUserPermissionsInObject(obj);
    }

    public Mono<Boolean> archiveAllById(java.util.Collection<String> ids) {
        return Mono.justOrEmpty(repository.archiveAllById(ids));
    }

    public Flux<Theme> getApplicationThemes(String applicationId, AclPermission aclPermission) {
        return Flux.fromIterable(repository.getApplicationThemes(applicationId, aclPermission));
    }

    public Mono<Theme> archive(Theme entity) {
        return Mono.justOrEmpty(repository.archive(entity));
    }
}
