package com.appsmith.server.repositories;

import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.data.repository.NoRepositoryBean;
import reactor.core.publisher.Mono;

import java.io.Serializable;
import java.util.List;

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
}
