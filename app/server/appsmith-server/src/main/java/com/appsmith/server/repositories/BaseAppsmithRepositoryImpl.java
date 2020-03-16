package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.QBaseDomain;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.querydsl.core.types.Path;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.GenericTypeResolver;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.util.Assert;
import reactor.core.publisher.Mono;

import java.util.Map;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public abstract class BaseAppsmithRepositoryImpl<T extends BaseDomain> {

    protected final ReactiveMongoOperations mongoOperations;

    private final Class<T> genericDomain;

    protected final MongoConverter mongoConverter;

    public BaseAppsmithRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        this.mongoOperations = mongoOperations;
        this.mongoConverter = mongoConverter;
        this.genericDomain = (Class<T>) GenericTypeResolver.resolveTypeArgument(getClass(), BaseAppsmithRepositoryImpl.class);
    }

    public static final String fieldName(Path path) {
        return path != null ? path.getMetadata().getName() : null;
    }

    public static final Criteria notDeleted() {
        return new Criteria().orOperator(
                where(fieldName(QBaseDomain.baseDomain.deleted)).exists(false),
                where(fieldName(QBaseDomain.baseDomain.deleted)).is(false)
        );
    }

    public static final Criteria userAcl(User user, AclPermission permission) {
        log.debug("Going to add userAcl for user: {} and permission: {}", user.getUsername(), permission.getValue());

        Criteria userCriteria = Criteria.where(fieldName(QBaseDomain.baseDomain.policies))
                .elemMatch(Criteria.where("users").all(user.getUsername())
                        .and("permission").is(permission.getValue())
                );
        log.debug("Got the userCriteria: {}", userCriteria.getCriteriaObject());

        Criteria groupCriteria = Criteria.where(fieldName(QBaseDomain.baseDomain.policies))
                .elemMatch(Criteria.where("groups").all(user.getGroupIds())
                        .and("permission").is(permission.getValue()));

        log.debug("Got the groupCriteria: {}", groupCriteria.getCriteriaObject());
        return new Criteria().orOperator(userCriteria, groupCriteria);
    }

    protected Criteria getIdCriteria(Object id) {
        return where("id").is(id);
    }

    protected DBObject getDbObject(Object o) {
        BasicDBObject basicDBObject = new BasicDBObject();
        mongoConverter.write(o, basicDBObject);
        return basicDBObject;
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

    public Mono<T> updateById(String id, T resource, AclPermission permission) {
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> {
                    Query query = new Query(Criteria.where("id").is(id));
                    query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl((User) principal, permission)));

                    DBObject update = getDbObject(resource);
                    Update updateObj = new Update();
                    Map<String, Object> updateMap = update.toMap();
                    updateMap.entrySet().stream().forEach(entry -> updateObj.set(entry.getKey(), entry.getValue()));

                    return mongoOperations.updateFirst(query, updateObj, resource.getClass())
                            .flatMap(obj -> {
                                if (obj.getMatchedCount() == 0) {
                                    return Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, resource.getClass().getSimpleName().toLowerCase(), id));
                                }
                                return findById(id, permission);
                            });
                });
    }
}
