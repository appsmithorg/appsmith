package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.querydsl.QuerydslPredicateExecutor;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.io.Serializable;
import java.time.Instant;
import java.util.Collection;
import java.util.Optional;

@NoRepositoryBean
public interface BaseRepository<T extends BaseDomain, ID extends Serializable>
        extends CrudRepository<T, ID>, QuerydslPredicateExecutor<T>, JpaSpecificationExecutor<T> {

    @Override
    @Query("SELECT e FROM #{#entityName} e WHERE e.deletedAt IS NULL AND e.id = :id")
    Optional<T> findById(ID id);

    @Override
    @Query("SELECT e FROM #{#entityName} e WHERE e.deletedAt IS NULL")
    Iterable<T> findAll();

    /**
     * This function sets the deleted flag to true and then saves the modified document.
     *
     * @param entity The entity which needs to be archived
     * @return Optional<T>
     */
    @Modifying
    /*no-cake*/ default T archive(T entity) {
        // TODO: Some code using this method relies on the `deletedAt` field being set. So we can't use `archiveById`.
        entity.setDeletedAt(Instant.now());
        return save(entity);
    }

    /**
     * This function directly updates the document by setting the deleted flag to true for the entity with the given id
     *
     * @param id The id of the document that needs to be archived
     * @return
     */
    @Modifying
    @Query("UPDATE #{#entityName} e SET e.deletedAt = instant WHERE e.id = :id")
    /*no-cake*/ int archiveById(String id);

    /**
     * This function directly updates the DB by setting the deleted flag to true for all the documents in the collection
     * with the given list of ids.
     *
     * @param ids The list of ids of the document that needs to be archived.
     * @return
     */
    @Modifying
    @Query("UPDATE #{#entityName} e SET e.deletedAt = instant WHERE e.id IN :ids")
    /*no-cake*/ Optional<Boolean> archiveAllById(Collection<ID> ids);
}
