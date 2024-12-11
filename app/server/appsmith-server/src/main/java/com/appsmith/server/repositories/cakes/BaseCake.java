package com.appsmith.server.repositories.cakes;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.transaction.CustomTransactionalOperator;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.constants.FieldName.PERMISSION_GROUPS;
import static com.appsmith.server.constants.ce.FieldNameCE.TX_CONTEXT;
import static com.appsmith.server.helpers.ReactorUtils.asFlux;
import static com.appsmith.server.helpers.ReactorUtils.asMonoDirect;

@Slf4j
@RequiredArgsConstructor
public abstract class BaseCake<T extends BaseDomain, R extends BaseRepository<T, String>> {
    private final R repository;

    @Autowired
    @Getter
    private EntityManager entityManager;

    @Autowired
    private CacheableRepositoryHelper cacheableRepositoryHelper;

    @Autowired
    CustomTransactionalOperator transactionalOperator;

    protected final Class<T> genericDomain;

    // ---------------------------------------------------
    // Wrappers for methods from BaseRepository
    // ---------------------------------------------------
    public Flux<T> findAllById(Iterable<String> ids) {
        return Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager)))
                .flatMapMany(em -> asFlux(() -> em.createQuery(
                                "SELECT e FROM " + genericDomain.getSimpleName() + " e WHERE e.id IN :ids",
                                genericDomain)
                        .setParameter("ids", ids)
                        .getResultList()));
    }

    public Mono<T> findById(String id) {
        return Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager)))
                .flatMap(em -> asMonoDirect(() -> em.createQuery(
                                "SELECT e FROM " + genericDomain.getSimpleName() + " e WHERE e.id = :id", genericDomain)
                        .setParameter("id", id)
                        .getSingleResult()));
    }

    public Flux<T> findAll() {
        return Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager)))
                .flatMapMany(em -> asFlux(
                        () -> em.createQuery("SELECT e FROM " + genericDomain.getSimpleName() + " e", genericDomain)
                                .getResultList()));
    }

    @Deprecated(forRemoval = true)
    public Mono<T> archive(T entity) {
        return Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager)))
                .flatMap(em -> {
                    if (entity.isDeleted()) {
                        return Mono.just(entity);
                    }
                    // Setting the deletedAt and then saving the entity throwing the exceptions in few cases of trying
                    // to create
                    // new entry with same id hence relying on JPA generated method.
                    return this.archiveById(entity.getId()).map(cnt -> {
                        if (cnt == 0 && entity.getDeletedAt() == null) {
                            log.error(
                                    "Entity with id {} and type {} not found to archive",
                                    entity.getId(),
                                    entity.getClass().getSimpleName());
                        } else if (entity.getDeletedAt() == null) {
                            entity.setDeletedAt(Instant.now());
                        }
                        return entity;
                    });
                });
    }

    public Mono<Integer> archiveById(String id) {
        return Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager)))
                .flatMap(em -> asMonoDirect(() -> em.createQuery("UPDATE " + genericDomain.getSimpleName()
                                + " e SET e.deletedAt = :instant WHERE e.deletedAt IS NULL AND e.id = :id")
                        .setParameter("instant", Instant.now())
                        .setParameter("id", id)
                        .executeUpdate()))
                .as(transactionalOperator::transactional);
    }

    public Mono<Boolean> archiveAllById(Collection<String> ids) {
        return Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager)))
                .flatMap(em -> asMonoDirect(() -> em.createQuery("UPDATE " + genericDomain.getSimpleName()
                                        + " e SET e.deletedAt = :instant WHERE e.deletedAt IS NULL AND e.id IN :ids")
                                .setParameter("instant", Instant.now())
                                .setParameter("ids", ids)
                                .executeUpdate()
                        > 0))
                .as(transactionalOperator::transactional);
    }

    public Mono<Integer> deleteById(String id) {
        return Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager)))
                .flatMap(em -> asMonoDirect(() -> em.createQuery("DELETE FROM " + genericDomain.getSimpleName()
                                + " e WHERE e.deletedAt IS NULL AND e.id = :id")
                        .setParameter("id", id)
                        .executeUpdate()))
                .as(transactionalOperator::transactional);
    }

    public Mono<Integer> deleteAll() {
        return Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager)))
                .flatMap(em -> asMonoDirect(() -> em.createQuery(
                                "DELETE FROM " + genericDomain.getSimpleName() + " e WHERE e.deletedAt IS NULL")
                        .executeUpdate()))
                .as(transactionalOperator::transactional);
    }

    public Flux<T> saveAll(Iterable<T> entities) {
        return Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager)))
                .flatMap(em -> asMonoDirect(() -> {
                    for (T entity : entities) {
                        if (entity.getId() == null) {
                            entity.setId(generateId());
                            em.persist(entity);
                        } else {
                            em.merge(entity);
                        }
                    }
                    return entities;
                }))
                .as(transactionalOperator::transactional)
                .flatMapMany(Flux::fromIterable);
    }

    public Mono<Long> count() {
        return Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager)))
                .flatMap(em -> asMonoDirect(
                        () -> em.createQuery("SELECT COUNT(e) FROM " + genericDomain.getSimpleName() + " e", Long.class)
                                .getSingleResult()));
    }

    // ---------------------------------------------------
    // Wrappers for methods from CRUDRepository
    // ---------------------------------------------------
    public Mono<T> save(T entity) {
        return Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager)))
                .flatMap(em -> {
                    final boolean isNew = entity.getId() == null;
                    return asMonoDirect(() -> {
                        try {
                            if (isNew) {
                                entity.setId(generateId());
                                em.persist(entity);
                                return entity;
                            } else {
                                return em.merge(entity);
                            }
                        } catch (DataIntegrityViolationException e) {
                            // save wasn't successful, reset the id if it was generated
                            if (isNew) {
                                entity.setId(null);
                            }
                            throw e;
                        } catch (Exception e) {
                            // This should NEVER happen in live/production environments.
                            if (isNew) {
                                entity.setId(null);
                            }
                            log.error("Couldn't save entity", e);
                            throw new RuntimeException(e);
                        }
                    });
                })
                .as(transactionalOperator::transactional);
    }

    private String generateId() {
        return UUID.randomUUID().toString();
    }

    public Mono<T> findById(String id, AclPermission permission) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> (User) ctx.getAuthentication().getPrincipal())
                .zipWith(Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager))))
                .flatMap(tuple -> this.getAllPermissionGroupsForUser(tuple.getT1(), tuple.getT2())
                        .zipWith(Mono.just(tuple.getT2())))
                .flatMap(tuple2 -> {
                    final ArrayList<String> permissionGroups = new ArrayList<>(tuple2.getT1());
                    final EntityManager em = tuple2.getT2();
                    final CriteriaBuilder cb = em.getCriteriaBuilder();
                    final CriteriaQuery<T> cq = cb.createQuery(genericDomain);
                    final Root<T> root = cq.from(genericDomain);

                    if (permission != null) {
                        cq.where(cb.and(
                                cb.equal(root.get(FieldName.ID), id),
                                cb.function(
                                        "jsonb_exists_any",
                                        Boolean.class,
                                        cb.function(
                                                "jsonb_extract_path",
                                                String.class,
                                                root.get(BaseDomain.Fields.policyMap),
                                                cb.literal(permission.getValue()),
                                                cb.literal(PERMISSION_GROUPS)),
                                        cb.literal(permissionGroups.toArray(new String[0])))));
                    }
                    return asMonoDirect(() -> em.createQuery(cq).getSingleResult());
                });
    }

    // FIXME: Duplicate from BaseAppsmithRepositoryCEImpl
    private Mono<Set<String>> getAllPermissionGroupsForUser(User user, EntityManager em) {
        if (user.getTenantId() == null) {
            user.setTenantId(cacheableRepositoryHelper.getDefaultTenantId().block());
        }

        return Mono.zip(
                        cacheableRepositoryHelper.getPermissionGroupsOfUser(user, em),
                        cacheableRepositoryHelper.getPermissionGroupsOfAnonymousUser())
                .map(tuple -> {
                    final Set<String> permissionGroups = new HashSet<>(tuple.getT1());
                    permissionGroups.addAll(tuple.getT2());
                    return permissionGroups;
                });
    }

    public Mono<T> updateById(String id, T updates, AclPermission permission) {
        updates.setId(null);

        return findById(id, permission)
                .zipWith(Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager))))
                .flatMap(tuple2 -> {
                    final T existingEntity = tuple2.getT1();
                    final EntityManager em = tuple2.getT2();
                    AppsmithBeanUtils.copyNewFieldValuesIntoOldObject(updates, existingEntity);
                    em.merge(existingEntity);
                    return Mono.just(existingEntity);
                })
                .as(transactionalOperator::transactional);
    }

    public Mono<Void> delete(T entity) {
        return this.deleteById(entity.getId()).then();
    }
}
