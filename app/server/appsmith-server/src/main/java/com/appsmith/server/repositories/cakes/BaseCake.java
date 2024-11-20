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
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static com.appsmith.server.constants.FieldName.PERMISSION_GROUPS;

@Slf4j
@RequiredArgsConstructor
public abstract class BaseCake<T extends BaseDomain, R extends BaseRepository<T, String>> {
    private final R repository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private CacheableRepositoryHelper cacheableRepositoryHelper;

    protected final Class<T> genericDomain;

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
                        final T savedEntity = repository.save(entity);
                        copyTransientFieldValues(entity, savedEntity, 1);
                        return savedEntity;
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

    public Flux<T> findAll() {
        return Mono.fromSupplier(repository::findAll)
                .flatMapMany(Flux::fromIterable)
                .subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<T> findById(String id) {
        return Mono.fromSupplier(() -> repository.findById(id).orElse(null)).subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<T> findById(String id, AclPermission permission) {
        return findById(id, permission, entityManager);
    }

    public Mono<T> findById(String id, AclPermission permission, EntityManager em) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> (User) ctx.getAuthentication().getPrincipal())
                .flatMap(this::getAllPermissionGroupsForUser)
                .map(ArrayList::new)
                .map(permissionGroups -> {
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
