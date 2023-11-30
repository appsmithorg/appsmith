package com.appsmith.server.repositories;

import com.mongodb.client.result.UpdateResult;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.io.Serializable;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@NoRepositoryBean
public interface BaseRepository<T, ID extends Serializable>
        extends CrudRepository<T, ID> /*, QuerydslPredicateExecutor<T>*/ {

    /**
     * This function should be used to get an object from the DB without applying any ACL rules
     *
     * @param id The identifier for this type
     * @return Optional<T>
     */
    Optional<T> retrieveById(ID id);

    /**
     * This function sets the deleted flag to true and then saves the modified document.
     *
     * @param entity The entity which needs to be archived
     * @return Optional<T>
     */
    Optional<T> archive(T entity);

    /**
     * This function directly updates the document by setting the deleted flag to true for the entity with the given id
     *
     * @param id The id of the document that needs to be archived
     * @return
     */
    Optional<Boolean> archiveById(ID id);

    /**
     * This function directly updates the DB by setting the deleted flag to true for all the documents in the collection
     * with the given list of ids.
     *
     * @param ids The list of ids of the document that needs to be archived.
     * @return
     */
    Optional<Boolean> archiveAllById(Collection<ID> ids);

    Optional<T> findByIdAndBranchName(ID id, String branchName);

    /**
     * When `fieldNames` is blank, this method will return the entire object. Otherwise, it will return only the values
     * against the `fieldNames` property in the matching object.
     */
    Optional<T> findByIdAndFieldNames(ID id, List<String> fieldNames);

}
