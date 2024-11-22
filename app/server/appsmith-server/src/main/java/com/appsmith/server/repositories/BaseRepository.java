package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.io.Serializable;
import java.lang.reflect.ParameterizedType;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@NoRepositoryBean
public interface BaseRepository<T extends BaseDomain, ID extends Serializable> extends CrudRepository<T, ID> {

    default Optional<T> findById(ID id, EntityManager entityManager) {
        return Optional.ofNullable(entityManager
                .createQuery(
                        "FROM " + getDomainClass().getSimpleName() + " e WHERE e.id = :id AND e.deletedAt IS NULL",
                        getDomainClass())
                .setParameter("id", id)
                .getSingleResult());
    }

    default List<T> findAllById(Collection<ID> ids, EntityManager entityManager) {
        return entityManager
                .createQuery(
                        "FROM " + getDomainClass().getSimpleName() + " e WHERE e.id IN :ids AND e.deletedAt IS NULL",
                        getDomainClass())
                .setParameter("ids", ids)
                .getResultList();
    }

    default List<T> findAll(EntityManager entityManager) {
        return entityManager
                .createQuery(
                        "FROM " + getDomainClass().getSimpleName() + " e WHERE e.deletedAt IS NULL", getDomainClass())
                .getResultList();
    }

    /**
     * This function sets the deleted flag to true and then saves the modified document.
     *
     * @param entity The entity which needs to be archived
     * @return Optional<T>
     */
    // TODO: Some code using this method relies on the `deletedAt` field being set.
    @Deprecated(forRemoval = true)
    @Modifying
    @Transactional
    default T archive(T entity, EntityManager entityManager) {
        if (entity.isDeleted()) {
            return entity;
        }
        // Setting the deletedAt and then saving the entity throwing the exceptions in few cases of trying to create
        // new entry with same id hence relying on JPA generated method.
        this.archiveById(entity.getId(), entityManager);
        entityManager.find(getDomainClass(), entity.getId());
        return entity;
    }

    /**
     * This function directly updates the document by setting the deleted flag to true for the entity with the given id
     *
     * @param id The id of the document that needs to be archived
     * @return
     */
    @Modifying
    @Transactional
    default int archiveById(String id, EntityManager entityManager) {
        return entityManager
                .createQuery("UPDATE " + getDomainClass().getSimpleName()
                        + " e SET e.deletedAt = :instant WHERE e.deletedAt IS NULL AND e.id = :id")
                .setParameter("instant", Instant.now())
                .setParameter("id", id)
                .executeUpdate();
    }

    /**
     * This function directly updates the DB by setting the deleted flag to true for all the documents in the collection
     * with the given list of ids.
     *
     * @param ids The list of ids of the document that needs to be archived.
     * @return
     */
    @Modifying
    @Transactional
    default Boolean archiveAllById(Collection<ID> ids, EntityManager entityManager) {
        return entityManager
                        .createQuery("UPDATE " + getDomainClass().getSimpleName()
                                + " e SET e.deletedAt = :instant WHERE e.deletedAt IS NULL AND e.id IN :ids")
                        .setParameter("instant", Instant.now())
                        .setParameter("ids", ids)
                        .executeUpdate()
                > 0;
    }

    @Modifying
    @Transactional
    default int deleteById(String id, EntityManager entityManager) {
        return entityManager
                .createQuery("DELETE FROM " + getDomainClass().getSimpleName() + " e WHERE e.id = :id")
                .setParameter("id", id)
                .executeUpdate();
    }

    @Modifying
    @Transactional
    default int deleteAll(EntityManager entityManager) {
        return entityManager
                .createQuery("DELETE FROM " + getDomainClass().getSimpleName() + " e WHERE e.deletedAt IS NULL")
                .executeUpdate();
    }

    @Modifying
    @Transactional
    default Iterable<T> saveAll(Iterable<T> entities, EntityManager entityManager) {
        entities.forEach(entityManager::persist);
        return entities;
    }

    default Long count(EntityManager entityManager) {
        return entityManager
                .createQuery(
                        "SELECT COUNT(e) FROM " + getDomainClass().getSimpleName() + " e WHERE e.deletedAt IS NULL",
                        Long.class)
                .getSingleResult();
    }

    // Helper method to infer the domain class
    @SuppressWarnings("unchecked")
    private Class<T> getDomainClass() {
        // Infer the domain class from the generic type
        return (Class<T>) ((ParameterizedType) getClass().getGenericInterfaces()[0]).getActualTypeArguments()[0];
    }
}
