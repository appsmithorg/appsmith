package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.User;
import com.mongodb.client.result.UpdateResult;
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

import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.apache.commons.lang3.StringUtils.isBlank;
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
 *
 * In case you are wondering why we have two different repository implementation classes i.e.
 * BaseRepositoryImpl.java and BaseAppsmithRepositoryCEImpl.java, Arpit's comments on this might be helpful:
 * ```
 * BaseRepository is required for running any JPA queries. This doesn’t invoke any ACL permissions. This is used when
 * we wish to fetch data from the DB without ACL. For eg, Fetching a user by username during login
 * Usage example:
 * ActionCollectionRepositoryCE extends BaseRepository to power JPA queries using the ReactiveMongoRepository.
 * AppsmithRepository is the one that we should use by default (unless the use case demands that we don’t need ACL).
 * It is implemented by BaseAppsmithRepositoryCEImpl and BaseAppsmithRepositoryImpl. This interface allows us to
 * define custom Mongo queries by including the delete functionality & ACL permissions.
 * Usage example:
 * CustomActionCollectionRepositoryCE extends AppsmithRepository and then implements the functions defined there.
 * I agree that the naming is a little confusing. Open to hearing better naming suggestions so that we can improve
 * the understanding of these interfaces.
 * ```
 * Ref: https://theappsmith.slack.com/archives/CPQNLFHTN/p1669100205502599?thread_ts=1668753437.497369&cid=CPQNLFHTN
 */
@Slf4j
public class BaseRepositoryImpl<T extends BaseDomain, ID extends Serializable> extends SimpleReactiveMongoRepository<T, ID>
        implements BaseRepository<T, ID> {

    protected final MongoEntityInformation<T, ID> entityInformation;
    protected final ReactiveMongoOperations mongoOperations;

    public BaseRepositoryImpl(@NonNull MongoEntityInformation<T, ID> entityInformation,
                              @NonNull ReactiveMongoOperations mongoOperations) {
        super(entityInformation, mongoOperations);
        this.entityInformation = entityInformation;
        this.mongoOperations = mongoOperations;
    }

    private Criteria notDeleted() {
        return new Criteria().andOperator(
                new Criteria().orOperator(
                        where(FieldName.DELETED).exists(false),
                        where(FieldName.DELETED).is(false)
                ),
                new Criteria().orOperator(
                        where(FieldName.DELETED_AT).exists(false),
                        where(FieldName.DELETED_AT).is(null)
                )
        );
    }

    private Criteria getIdCriteria(Object id) {
        return where(entityInformation.getIdAttribute()).is(id);
    }

    /**
     * When `fieldName` is blank, this method will return the entire object. Otherwise, it will return only the value
     * against the `fieldName` property in the matching object.
     */
    @Override
    public Mono<T> findByIdAndFieldNames(ID id, List<String> fieldNames) {
        Assert.notNull(id, "The given id must not be null!");
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> {
                    Query query = new Query(getIdCriteria(id));
                    query.addCriteria(notDeleted());

                    if (fieldNames != null && fieldNames.size() > 0) {
                        fieldNames.forEach(fieldName -> {
                            if (!isBlank(fieldName)) {
                                query.fields().include(fieldName);
                            }
                        });
                    }

                    return mongoOperations.query(entityInformation.getJavaType())
                            .inCollection(entityInformation.getCollectionName())
                            .matching(query)
                            .one();
                });
    }

    @Override
    public Mono<T> findById(ID id) {
        return this.findByIdAndFieldNames(id, null);
    }

    @Override
    public Mono<T> findByIdAndBranchName(ID id, String branchName) {
        // branchName will be ignored and this method is overridden for the services which are shared across branches
        return this.findById(id);
    }

    /**
     * This method is supposed to update the given list of field names with the associated values in an object as opposed to replacing the entire object.
     */
    @Override
    public Mono<UpdateResult> updateByIdAndFieldNames(@NotNull ID id, @NotNull Map<String, Object> fieldNameValueMap) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> {
                    Query query = new Query(getIdCriteria(id));
                    query.addCriteria(notDeleted());

                    Update update = new Update();
                    fieldNameValueMap.forEach((fieldName, fieldValue) -> {
                        update.set(fieldName, fieldValue);
                    });

                    return mongoOperations.updateFirst(query, update, entityInformation.getJavaType());
                });
    }

    @Override
    public Flux<T> findAll() {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMapMany(principal -> {
                    Query query = new Query(notDeleted());
                    return mongoOperations.find(query, entityInformation.getJavaType(), entityInformation.getCollectionName());
                });
    }

    @Override
    public Flux<T> findAll(Example example, Sort sort) {
        Assert.notNull(example, "Sample must not be null!");
        Assert.notNull(sort, "Sort must not be null!");

        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMapMany(principal -> {

                    Criteria criteria = new Criteria().andOperator(
                            //Older check for deleted
                            new Criteria().orOperator(
                                    where(FieldName.DELETED).exists(false),
                                    where(FieldName.DELETED).is(false)
                            ),
                            //New check for deleted
                            new Criteria().orOperator(
                                    where(FieldName.DELETED_AT).exists(false),
                                    where(FieldName.DELETED_AT).is(null)
                            ),
                            // Set the criteria as the example
                            new Criteria().alike(example)
                    );

                    Query query = new Query(criteria)
                            .collation(entityInformation.getCollation()) //
                            .with(sort);

                    return mongoOperations.find(query, example.getProbeType(), entityInformation.getCollectionName());
                });
    }

    @Override
    public Flux<T> findAll(Example example) {

        Assert.notNull(example, "Example must not be null!");
        return findAll(example, Sort.unsorted());
    }

    @Override
    public Mono<T> archive(T entity) {
        Assert.notNull(entity, "The given entity must not be null!");
        Assert.notNull(entity.getId(), "The given entity's id must not be null!");
        // Entity is already deleted
        if (entity.isDeleted()) {
            return Mono.just(entity);
        }

        entity.setDeleted(true);
        entity.setDeletedAt(Instant.now());
        return mongoOperations.save(entity, entityInformation.getCollectionName());
    }

    @Override
    public Mono<Boolean> archiveById(ID id) {
        Assert.notNull(id, "The given id must not be null!");

        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> {
                    Query query = new Query(getIdCriteria(id));
                    query.addCriteria(notDeleted());

                    Update update = new Update();
                    update.set(FieldName.DELETED, true);
                    update.set(FieldName.DELETED_AT, Instant.now());
                    return mongoOperations.updateFirst(query, update, entityInformation.getJavaType())
                            .map(result -> result.getModifiedCount() > 0 ? true : false);
                });
    }

    @Override
    public Mono<Boolean> archiveAllById(List<ID> ids) {
        Assert.notNull(ids, "The given ids must not be null!");
        Assert.notEmpty(ids, "The given list of ids must not be empty!");

        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> {
                    Query query = new Query();
                    query.addCriteria(new Criteria().where(FieldName.ID).in(ids));
                    query.addCriteria(notDeleted());

                    Update update = new Update();
                    update.set(FieldName.DELETED, true);
                    update.set(FieldName.DELETED_AT, Instant.now());
                    return mongoOperations.updateMulti(query, update, entityInformation.getJavaType())
                            .map(result -> result.getModifiedCount() > 0 ? true : false);
                });
    }
}
