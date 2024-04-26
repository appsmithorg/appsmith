package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.io.Serializable;
import java.time.Instant;
import java.util.Collection;
import java.util.Optional;

@NoRepositoryBean
public interface BaseRepository<T extends BaseDomain, ID extends Serializable> extends CrudRepository<T, ID> {

    @Override
    @Query("FROM #{#entityName} e WHERE e.deletedAt IS NULL AND e.id = :id")
    Optional<T> findById(ID id);

    @Override
    @Query("FROM #{#entityName} e WHERE e.deletedAt IS NULL")
    Iterable<T> findAll();

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
    /*no-cake*/ default T archive(T entity) {
        if (entity.isDeleted()) {
            return entity;
        }
        // Setting the deletedAt and then saving the entity throwing the exceptions in few cases of trying to create
        // new entry with same id hence relying on JPA generated method.
        this.archiveById(entity.getId());
        entity.setDeletedAt(Instant.now());
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
    @Query("UPDATE #{#entityName} e SET e.deletedAt = instant WHERE e.deletedAt IS NULL AND e.id = :id")
    /*no-cake*/ int archiveById(String id);

    /**
     * This function directly updates the DB by setting the deleted flag to true for all the documents in the collection
     * with the given list of ids.
     *
     * @param ids The list of ids of the document that needs to be archived.
     * @return
     */
    @Modifying
    @Transactional
    @Query("UPDATE #{#entityName} e SET e.deletedAt = instant WHERE e.deletedAt IS NULL AND e.id IN :ids")
    /*no-cake*/ int archiveAllById(Collection<ID> ids);
}
