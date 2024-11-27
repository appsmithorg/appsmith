package com.appsmith.server.repositories.cakes;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Transient;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.transaction.support.TransactionTemplate;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
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
    private TransactionTemplate transactionTemplate;

    @Autowired
    private CacheableRepositoryHelper cacheableRepositoryHelper;

    protected final Class<T> genericDomain;

    // ---------------------------------------------------
    // Wrappers for methods from BaseRepository
    // ---------------------------------------------------
    public Flux<T> findAllById(Collection<String> ids) {
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
                    return this.archiveById(entity.getId()).handle((cnt, sink) -> {
                        if (cnt == 0) {
                            sink.error(new RuntimeException("Entity not found"));
                            return;
                        }
                        entity.setDeletedAt(Instant.now());
                        sink.next(entity);
                    });
                });
    }

    public Mono<Integer> archiveById(String id) {
        return Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager)))
                .flatMap(em -> asMonoDirect(
                        () -> transactionTemplate.execute(ts -> em.createQuery("UPDATE " + genericDomain.getSimpleName()
                                        + " e SET e.deletedAt = :instant WHERE e.deletedAt IS NULL AND e.id = :id")
                                .setParameter("instant", Instant.now())
                                .setParameter("id", id)
                                .executeUpdate())));
    }

    public Mono<Boolean> archiveAllById(Collection<String> ids) {
        return Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager)))
                .flatMap(em -> asMonoDirect(() -> transactionTemplate.execute(ts -> em.createQuery(
                                        "UPDATE " + genericDomain.getSimpleName()
                                                + " e SET e.deletedAt = :instant WHERE e.deletedAt IS NULL AND e.id IN :ids")
                                .setParameter("instant", Instant.now())
                                .setParameter("ids", ids)
                                .executeUpdate()
                        > 0)));
    }

    public Mono<Integer> deleteById(String id) {
        return Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager)))
                .flatMap(em -> asMonoDirect(() -> transactionTemplate.execute(ts -> em.createQuery("DELETE FROM "
                                + genericDomain.getSimpleName() + " e WHERE e.deletedAt IS NULL AND e.id = :id")
                        .setParameter("id", id)
                        .executeUpdate())));
    }

    public Mono<Integer> deleteAll() {
        return Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager)))
                .flatMap(em -> asMonoDirect(() -> {
                    return transactionTemplate.execute(ts -> em.createQuery(
                                    "DELETE FROM " + genericDomain.getSimpleName() + " e WHERE e.deletedAt IS NULL")
                            .executeUpdate());
                }));
    }

    public Flux<T> saveAll(Iterable<T> entities) {
        return Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager)))
                .flatMapMany(em -> asFlux(() -> transactionTemplate.execute(ts -> {
                    for (T entity : entities) {
                        if (entity.getId() == null) {
                            entity.setId(generateId());
                            em.persist(entity);
                        } else {
                            em.merge(entity);
                        }
                    }
                    return entities;
                })));
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
                    return Mono.fromSupplier(() -> {
                                try {
                                    transactionTemplate.execute(ts -> {
                                        if (isNew) {
                                            entity.setId(generateId());
                                            em.persist(entity);
                                            return entity;
                                        } else {
                                            return em.merge(entity);
                                        }
                                    });
                                    return entity;
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
                            })
                            .subscribeOn(Schedulers.boundedElastic());
                });
    }

    /**
     * Copy the values of fields marked with {@link Transient} annotation from {@code source} to {@code target}.
     * This is also done recursively, for nested object fields as well, unless {@code nest} is 0.
     */
    private static <T> void copyTransientFieldValues(T source, T target, int nest) throws IllegalAccessException {
        final Class<?> cls = source.getClass();

        // Get all non-transient field names
        final List<Field> nonTransientFields = getAllFields(cls).stream()
                .filter(field -> field.getAnnotation(Transient.class) == null)
                .toList();

        final List<String> nonTransientFieldNames =
                nonTransientFields.stream().map(Field::getName).toList();

        // merge latest database updated source object with the transient fields
        BeanUtils.copyProperties(source, target, nonTransientFieldNames.toArray(new String[0]));

        if (nest > 0) {
            --nest;
            for (final Field nonTransientField : nonTransientFields) {
                nonTransientField.setAccessible(true);
                final Object sourceValue = nonTransientField.get(source);
                if (sourceValue == null) {
                    continue;
                }
                copyTransientFieldValues(sourceValue, nonTransientField.get(target), nest);
            }
        }
    }

    public static List<Field> getAllFields(Class<?> type) {
        List<Field> fields = new ArrayList<>();
        for (Class<?> c = type; c != null; c = c.getSuperclass()) {
            fields.addAll(Arrays.asList(c.getDeclaredFields()));
        }
        return fields;
    }

    private String generateId() {
        return UUID.randomUUID().toString();
    }

    public Mono<T> findById(String id, AclPermission permission) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> (User) ctx.getAuthentication().getPrincipal())
                .flatMap(this::getAllPermissionGroupsForUser)
                .map(ArrayList::new)
                .zipWith(Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager))))
                .map(tuple2 -> {
                    final ArrayList<String> permissionGroups = tuple2.getT1();
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
                    return em.createQuery(cq).getSingleResult();
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

    public Mono<T> updateById(String id, T updates, AclPermission permission) {
        updates.setId(null);

        return findById(id, permission)
                .zipWith(Mono.deferContextual(ctx -> Mono.just(ctx.getOrDefault(TX_CONTEXT, entityManager))))
                .flatMap(tuple2 -> {
                    final T existingEntity = tuple2.getT1();
                    final EntityManager em = tuple2.getT2();
                    AppsmithBeanUtils.copyNewFieldValuesIntoOldObject(updates, existingEntity);
                    transactionTemplate.execute(ts -> {
                        em.merge(existingEntity);
                        return existingEntity;
                    });
                    return findById(id, permission);
                });
    }

    public Mono<Void> delete(T entity) {
        return this.deleteById(entity.getId()).then();
    }
}
