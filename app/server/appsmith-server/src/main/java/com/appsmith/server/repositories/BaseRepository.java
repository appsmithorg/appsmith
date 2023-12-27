package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.io.Serializable;
import java.util.Collection;
import java.util.Optional;

@NoRepositoryBean
public interface BaseRepository<T extends BaseDomain, ID extends Serializable>
        extends CrudRepository<T, ID> /*, QuerydslPredicateExecutor<T>*/ {

    @Override
    @Query("SELECT e FROM #{#entityName} e WHERE e.deletedAt is null and e.id = :id")
    Optional<T> findById(ID id);

    @Override
    @Query("SELECT e FROM #{#entityName} e WHERE e.deletedAt is null")
    Iterable<T> findAll();

    /**
     * This function sets the deleted flag to true and then saves the modified document.
     *
     * @param entity The entity which needs to be archived
     * @return Optional<T>
     */
    default Optional<T> archive(T entity) {
        return archiveById(entity.getId()) ? Optional.of(entity) : Optional.empty();
    }

    /**
     * This function directly updates the document by setting the deleted flag to true for the entity with the given id
     *
     * @param id The id of the document that needs to be archived
     * @return
     */
    @Modifying
    @Query("UPDATE #{#entityName} e SET e.deletedAt = instant WHERE e.id = :id")
    boolean archiveById(String id);

    /**
     * This function directly updates the DB by setting the deleted flag to true for all the documents in the collection
     * with the given list of ids.
     *
     * @param ids The list of ids of the document that needs to be archived.
     * @return
     */
    @Modifying
    @Query("UPDATE #{#entityName} e SET e.deletedAt = instant WHERE e.id IN :ids")
    Optional<Boolean> archiveAllById(Collection<ID> ids);
}
