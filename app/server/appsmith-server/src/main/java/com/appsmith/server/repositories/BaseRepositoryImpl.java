package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.constants.FieldName;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.repository.query.MongoEntityInformation;
import org.springframework.data.mongodb.repository.support.SimpleReactiveMongoRepository;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.util.Assert;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.Serializable;
import java.time.Instant;
import java.util.Collection;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.notDeleted;
import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * This repository implementation is the base class that will be used by Spring Data running all the default JPA queries.
 * We override the default implementation {@link SimpleReactiveMongoRepository} to filter out records marked with
 * deleted=true.
 * To enable this base implementation, it MUST be set in the annotation @EnableReactiveMongoRepositories.repositoryBaseClass.
 * This is currently defined in {@link com.appsmith.server.configurations.MongoConfig} (liable to change in the future).
 * <p>
 * An implementation like this can also be used to set default query parameters based on the user's role and permissions
 * to filter out data that they are allowed to see. This is will be implemented with ACL.
 *
 * @param <T>  The domain class that extends {@link BaseDomain}. This is required because we use default fields in
 *             {@link BaseDomain} such as `deleted`
 * @param <ID> The ID field that extends Serializable interface
 *             <p>
 *             In case you are wondering why we have two different repository implementation classes i.e.
 *             BaseRepositoryImpl.java and BaseAppsmithRepositoryCEImpl.java, Arpit's comments on this might be helpful:
 *             ```
 *             BaseRepository is required for running any JPA queries. This doesn’t invoke any ACL permissions. This is used when
 *             we wish to fetch data from the DB without ACL. For eg, Fetching a user by username during login
 *             Usage example:
 *             ActionCollectionRepositoryCE extends BaseRepository to power JPA queries using the ReactiveMongoRepository.
 *             AppsmithRepository is the one that we should use by default (unless the use case demands that we don’t need ACL).
 *             It is implemented by BaseAppsmithRepositoryCEImpl and BaseAppsmithRepositoryImpl. This interface allows us to
 *             define custom Mongo queries by including the delete functionality & ACL permissions.
 *             Usage example:
 *             CustomActionCollectionRepositoryCE extends AppsmithRepository and then implements the functions defined there.
 *             I agree that the naming is a little confusing. Open to hearing better naming suggestions so that we can improve
 *             the understanding of these interfaces.
 *             ```
 *             Ref: https://theappsmith.slack.com/archives/CPQNLFHTN/p1669100205502599?thread_ts=1668753437.497369&cid=CPQNLFHTN
 */
@Slf4j
public class BaseRepositoryImpl<T extends BaseDomain, ID extends Serializable>
        extends SimpleReactiveMongoRepository<T, ID> implements BaseRepository<T, ID> {

    protected final MongoEntityInformation<T, ID> entityInformation;
    protected final ReactiveMongoOperations mongoOperations;

    public BaseRepositoryImpl(
            @NonNull MongoEntityInformation<T, ID> entityInformation,
            @NonNull ReactiveMongoOperations mongoOperations) {
        super(entityInformation, mongoOperations);
        this.entityInformation = entityInformation;
        this.mongoOperations = mongoOperations;
    }

    private Criteria getIdCriteria(Object id) {
        return where(entityInformation.getIdAttribute()).is(id);
    }

    @Override
    public Mono<T> findById(ID id) {
        Assert.notNull(id, "The given id must not be null!");
        Query query = new Query(getIdCriteria(id));
        query.addCriteria(notDeleted());

        return mongoOperations
                .query(entityInformation.getJavaType())
                .inCollection(entityInformation.getCollectionName())
                .matching(query)
                .one();
    }

    @Override
    public Flux<T> findAll() {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMapMany(principal -> {
                    Query query = new Query(notDeleted());
                    return mongoOperations.find(
                            query.cursorBatchSize(10000),
                            entityInformation.getJavaType(),
                            entityInformation.getCollectionName());
                });
    }

    @Override
    public Flux<T> retrieveAll() {
        Query query = new Query(notDeleted());
        return mongoOperations.find(
                query.cursorBatchSize(10000), entityInformation.getJavaType(), entityInformation.getCollectionName());
    }

    /**
     * We don't use this today, it doesn't use our `notDeleted` criteria, and since we don't use it, we're not porting
     * it to Postgres. Querying with `queryBuilder` or anything else is arguably more readable than this.
     */
    @Override
    public <S extends T> Flux<S> findAll(Example<S> example, Sort sort) {
        return Flux.error(new UnsupportedOperationException("This method is not supported!"));
    }

    @Override
    public Mono<T> archive(T entity) {
        Assert.notNull(entity, "The given entity must not be null!");
        Assert.notNull(entity.getId(), "The given entity's id must not be null!");
        // Entity is already deleted
        if (entity.isDeleted()) {
            return Mono.just(entity);
        }

        entity.setDeletedAt(Instant.now());
        return mongoOperations.save(entity, entityInformation.getCollectionName());
    }

    @Override
    public Mono<Boolean> archiveById(ID id) {
        Assert.notNull(id, "The given id must not be null!");

        Query query = new Query(getIdCriteria(id));
        query.addCriteria(notDeleted());

        return mongoOperations
                .updateFirst(query, getForArchive(), entityInformation.getJavaType())
                .map(result -> result.getModifiedCount() > 0 ? true : false);
    }

    public Update getForArchive() {
        Update update = new Update();
        update.set(FieldName.DELETED, true);
        update.set(FieldName.DELETED_AT, Instant.now());
        return update;
    }

    @Override
    public Mono<Boolean> archiveAllById(Collection<ID> ids) {
        Assert.notNull(ids, "The given ids must not be null!");
        Assert.notEmpty(ids, "The given list of ids must not be empty!");

        Query query = new Query();
        query.addCriteria(where(FieldName.ID).in(ids));
        query.addCriteria(notDeleted());

        return mongoOperations
                .updateMulti(query, getForArchive(), entityInformation.getJavaType())
                .map(result -> result.getModifiedCount() > 0);
    }
}
