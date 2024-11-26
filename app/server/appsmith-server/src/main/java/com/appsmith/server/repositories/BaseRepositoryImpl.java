package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.EntityManager;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Example;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.support.JpaEntityInformation;
import org.springframework.data.jpa.repository.support.SimpleJpaRepository;

import java.io.Serializable;
import java.util.List;
import java.util.Optional;

/**
 * This repository implementation is the base class that will be used by Spring Data running all the default JPA queries.
 * We override the default implementation SimpleReactiveMongoRepository to filter out records marked with
 * deleted=true.
 * To enable this base implementation, it MUST be set in the annotation @EnableReactiveMongoRepositories.repositoryBaseClass.
 * This is currently defined in MongoConfig (liable to change in the future).
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
public class BaseRepositoryImpl<T extends BaseDomain, ID extends Serializable> extends SimpleJpaRepository<T, ID>
/*implements BaseRepository<T, ID>*/ {

    protected final @NonNull JpaEntityInformation<T, ID> entityInformation;
    protected final @NonNull EntityManager entityManager;

    public BaseRepositoryImpl(
            @NonNull JpaEntityInformation<T, ID> entityInformation, @NonNull EntityManager entityManager) {
        super(entityInformation, entityManager);
        this.entityInformation = entityInformation;
        this.entityManager = entityManager;
    }

    @Override
    public @NonNull Optional<T> findById(@NonNull ID id) {
        throw new UnsupportedOperationException("Use the implementation from BaseRepository!");
    }

    /**
     * We don't use this today, it doesn't use our `notDeleted` criteria, and since we don't use it, we're not porting
     * it to Postgres. Querying with `queryBuilder` or anything else is arguably more readable than this.
     */
    @Override
    public <S extends T> List<S> findAll(Example<S> example, Sort sort) {
        throw new UnsupportedOperationException("This method is not supported!");
    }
}
