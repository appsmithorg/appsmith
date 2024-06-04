package com.appsmith.server.repositories.cakes;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RequiredArgsConstructor
public abstract class BaseCake<T extends BaseDomain, R extends BaseRepository<T, String>> {
    private final R repository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private CacheableRepositoryHelper cacheableRepositoryHelper;

    // ---------------------------------------------------
    // Wrappers for methods from BaseRepository
    // ---------------------------------------------------

    @Deprecated(forRemoval = true)
    public Mono<T> archive(T entity) {
        return Mono.fromSupplier(() -> repository.archive(entity)).subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<Boolean> archiveAllById(Collection<String> ids) {
        return Mono.fromSupplier(() -> repository.archiveAllById(ids) > 0).subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<Boolean> archiveById(String id) {
        return Mono.fromSupplier(() -> repository.archiveById(id) > 0).subscribeOn(Schedulers.boundedElastic());
    }

    // ---------------------------------------------------
    // Wrappers for methods from CRUDRepository
    // ---------------------------------------------------
    @Transactional
    @Modifying
    public Mono<T> save(T entity) {
        return Mono.fromSupplier(() -> {
                    final boolean isNew = entity.getId() == null;
                    if (isNew) {
                        entity.setId(generateId());
                    }
                    try {
                        repository.save(entity);
                        return entity;
                    } catch (DataIntegrityViolationException e) {
                        // save wasn't successful, reset the id if it was generated
                        if (isNew) {
                            entity.setId(null);
                        }
                        throw e;
                    }
                })
                .subscribeOn(Schedulers.boundedElastic());
    }

    private String generateId() {
        return UUID.randomUUID().toString();
    }

    public Flux<T> findAll() {
        return Mono.fromSupplier(repository::findAll)
                .flatMapMany(Flux::fromIterable)
                .subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<T> findById(String id) {
        return Mono.fromSupplier(() -> repository.findById(id).orElse(null)).subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<T> findById(String id, AclPermission permission) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> (User) ctx.getAuthentication().getPrincipal())
                .flatMap(this::getAllPermissionGroupsForUser)
                .map(ArrayList::new)
                .map(permissionGroups -> {
                    final CriteriaBuilder cb = entityManager.getCriteriaBuilder();
                    final CriteriaQuery<BaseDomain> cq = cb.createQuery(BaseDomain.class);
                    final Root<BaseDomain> root = cq.from(BaseDomain.class);

                    try {
                        Map<String, String> fnVars = new HashMap<>();
                        fnVars.put("p", permission.getValue());
                        final List<String> conditions = new ArrayList<>();
                        for (var i = 0; i < permissionGroups.size(); i++) {
                            fnVars.put("g" + i, permissionGroups.get(i));
                            conditions.add("@ == $g" + i);
                        }
                        cq.where(cb.and(
                                cb.equal(root.get(FieldName.ID), id),
                                cb.function(
                                        "jsonb_path_exists",
                                        Boolean.class,
                                        root.get(PermissionGroup.Fields.policies),
                                        cb.literal("$[*] ? (@.permission == $p && exists(@.permissionGroups ? ("
                                                + String.join(" || ", conditions) + ")))"),
                                        cb.literal(new ObjectMapper().writeValueAsString(fnVars)))));
                    } catch (JsonProcessingException e) {
                        throw new RuntimeException(e);
                    }

                    return (T) entityManager.createQuery(cq).getSingleResult();
                })
                .subscribeOn(Schedulers.boundedElastic());
    }

    // FIXME: Duplicate from BaseAppsmithRepositoryCEImpl
    private Mono<Set<String>> getAllPermissionGroupsForUser(User user) {
        if (user.getTenantId() == null) {
            user.setTenantId(cacheableRepositoryHelper.getDefaultTenantId().block());
        }

        return Mono.zip(
                        cacheableRepositoryHelper.getPermissionGroupsOfUser(user),
                        cacheableRepositoryHelper.getPermissionGroupsOfAnonymousUser())
                .map(tuple -> {
                    final Set<String> permissionGroups = new HashSet<>(tuple.getT1());
                    permissionGroups.addAll(tuple.getT2());
                    return permissionGroups;
                });
    }

    public Flux<T> findAllById(Iterable<String> ids) {
        return Mono.fromSupplier(() -> repository.findAllById(ids))
                .flatMapMany(Flux::fromIterable)
                .subscribeOn(Schedulers.boundedElastic());
    }

    @Transactional
    @Modifying
    public Mono<T> updateById(String id, T updates, AclPermission permission) {
        updates.setId(null);

        return findById(id, permission).flatMap(existingEntity -> {
            AppsmithBeanUtils.copyNewFieldValuesIntoOldObject(updates, existingEntity);
            return save(existingEntity);
        });
    }

    // TODO: This should be soft delete, not hard delete.
    public Mono<Void> deleteAll() {
        return Mono.<Void>fromRunnable(repository::deleteAll).subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<Void> deleteById(String id) {
        return Mono.<Void>fromRunnable(() -> repository.deleteById(id)).subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<Void> delete(T entity) {
        return Mono.<Void>fromRunnable(() -> repository.delete(entity)).subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<Long> count() {
        return Mono.fromSupplier(repository::count).subscribeOn(Schedulers.boundedElastic());
    }
}
