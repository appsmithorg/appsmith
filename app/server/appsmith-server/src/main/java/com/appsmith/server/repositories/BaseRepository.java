package com.appsmith.server.repositories;

import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.repository.NoRepositoryBean;
import reactor.core.publisher.Mono;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

@NoRepositoryBean
public interface BaseRepository<T, ID extends Serializable> extends ReactiveMongoRepository<T, ID> {

    /**
     * This function sets the deleted flag to true and then saves the modified document.
     *
     * @param T The entity which needs to be archived
     * @return Mono<T>
     */
    Mono<T> archive(T entity);

    /**
     * This function directly updates the document by setting the deleted flag to true for the entity with the given id
     *
     * @param id The id of the document that needs to be archived
     * @return
     */
    Mono<Boolean> archiveById(ID id);

    /**
     * This function directly updates the DB by setting the deleted flag to true for all the documents in the collection
     * with the given list of ids.
     *
     * @param ids The list of ids of the document that needs to be archived.
     * @return
     */
    Mono<Boolean> archiveAllById(List<ID> ids);

    Mono<T> findByIdAndBranchName(ID id, String branchName);

    /**
     * When `fieldNames` is blank, this method will return the entire object. Otherwise, it will return only the values
     * against the `fieldNames` property in the matching object.
     */
    Mono<T> findByIdAndFieldNames(ID id, List<String> fieldNames);

    /**
     * This method is supposed to update the given list of fields in an object as opposed to replacing the entire object.
     */
    Mono<UpdateResult> updateByIdAndFieldNames(ID id, Map<String, Object> fieldNameValueMap);
}
