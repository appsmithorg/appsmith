package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.QBaseDomain;
import com.appsmith.server.constants.AclPermission;
import com.appsmith.server.domains.User;
import com.querydsl.core.types.Path;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.GenericTypeResolver;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.util.Assert;
import reactor.core.publisher.Mono;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public abstract class BaseAppsmithRepositoryImpl<T extends BaseDomain> {

    private final ReactiveMongoOperations mongoOperations;

    private final Class<T> genericDomain;

    public BaseAppsmithRepositoryImpl(ReactiveMongoOperations mongoOperations) {
        this.mongoOperations = mongoOperations;
        this.genericDomain = (Class<T>) GenericTypeResolver.resolveTypeArgument(getClass(), BaseAppsmithRepositoryImpl.class);
    }

    public static final Criteria notDeleted() {
        return new Criteria().orOperator(
                where(fieldName(QBaseDomain.baseDomain.deleted)).exists(false),
                where(fieldName(QBaseDomain.baseDomain.deleted)).is(false)
        );
    }

    public static final Criteria userAcl(User user, AclPermission permission) {
        log.debug("Going to add userAcl for user: {} and permission: {}", user.getUsername(), permission.getValue());

        Criteria userCriteria = Criteria.where("policies")
                .elemMatch(Criteria.where("users").all(user.getUsername())
                        .and("permission").is(permission.getValue())
                );
        log.debug("Got the userCriteria: {}", userCriteria.getCriteriaObject());

        Criteria groupCriteria = Criteria.where("policies")
                .elemMatch(Criteria.where("groups").all(user.getGroupIds())
                        .and("permission").is(permission.getValue()));

        log.debug("Got the groupCriteria: {}", groupCriteria.getCriteriaObject());
        return new Criteria().orOperator(userCriteria, groupCriteria);
    }

    protected Criteria getIdCriteria(Object id) {
        return where("id").is(id);
    }

    public Mono<T> findById(String id, AclPermission permission) {
        Assert.notNull(id, "The given id must not be null!");
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> {
                    Query query = new Query(getIdCriteria(id));
                    query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl((User) principal, permission)));

                    return mongoOperations.query(this.genericDomain)
                            .matching(query)
                            .one();
                });
    }

    public static final String fieldName(Path path) {
        return path != null ? path.getMetadata().getName() : null;
    }
}
