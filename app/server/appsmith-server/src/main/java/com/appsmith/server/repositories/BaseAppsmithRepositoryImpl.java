package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Policy;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.GenericTypeResolver;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public abstract class BaseAppsmithRepositoryImpl<T extends BaseDomain> {

    protected final ReactiveMongoOperations mongoOperations;

    private final Class<T> genericDomain;

    protected final MongoConverter mongoConverter;

    @Autowired
    public BaseAppsmithRepositoryImpl(ReactiveMongoOperations mongoOperations,
                                      MongoConverter mongoConverter) {
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

        Criteria userCriteria = Criteria.where(fieldName(QBaseDomain.baseDomain.policies))
                .elemMatch(Criteria.where("users").all(user.getUsername())
                        .and("permission").is(permission.getValue())
                );

        Criteria anonymousUserCriteria = Criteria.where(fieldName(QBaseDomain.baseDomain.policies))
                .elemMatch(Criteria.where("users").all(FieldName.ANONYMOUS_USER)
                        .and("permission").is(permission.getValue())
                );

        Criteria groupCriteria = Criteria.where(fieldName(QBaseDomain.baseDomain.policies))
                .elemMatch(Criteria.where("groups").all(user.getGroupIds())
                        .and("permission").is(permission.getValue()));

        return new Criteria().orOperator(userCriteria, groupCriteria, anonymousUserCriteria);
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
        if (id == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ID));
        }
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> {
                    User user = (User) principal;
                    Query query = new Query(getIdCriteria(id));
                    query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(user, permission)));

                    return mongoOperations.query(this.genericDomain)
                            .matching(query)
                            .one()
                            .map(obj -> (T) setUserPermissionsInObject(obj, user));
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
                    User user = (User) principal;
                    Query query = new Query(Criteria.where("id").is(id));
                    query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(user, permission)));

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
                            })
                            .map(obj -> (T) setUserPermissionsInObject(obj, user));
                });
    }

    protected Mono<T> queryOne(List<Criteria> criterias, AclPermission aclPermission) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .flatMap(auth -> {
                    User user = (User) auth.getPrincipal();
                    Query query = new Query();
                    criterias.stream()
                            .forEach(criteria -> query.addCriteria(criteria));
                    if (aclPermission == null) {
                        query.addCriteria(new Criteria().andOperator(notDeleted()));
                    } else {
                        query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(user, aclPermission)));
                    }

                    return mongoOperations.query(this.genericDomain)
                            .matching(query)
                            .one()
                            .map(obj -> (T) setUserPermissionsInObject(obj, user));
                });
    }

    public Flux<T> queryAll(List<Criteria> criterias, AclPermission aclPermission) {
        return queryAll(criterias, aclPermission, null);
    }

    public Flux<T> queryAll(List<Criteria> criterias, AclPermission aclPermission, Sort sort) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .flatMapMany(auth -> {
                    User user = (User) auth.getPrincipal();
                    Query query = new Query();
                    criterias.stream()
                            .forEach(criteria -> query.addCriteria(criteria));
                    if (aclPermission == null) {
                        query.addCriteria(new Criteria().andOperator(notDeleted()));
                    } else {
                        query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(user, aclPermission)));
                    }
                    if (sort != null) {
                        query.with(sort);
                    }

                    return mongoOperations.query(this.genericDomain)
                            .matching(query)
                            .all()
                            .map(obj -> (T) setUserPermissionsInObject(obj, user));
                });
    }

    public T setUserPermissionsInObject(T obj, User user) {

        Set<String> permissions = new HashSet<>();

        for (Policy policy : obj.getPolicies()) {
            Set<String> policyUsers = policy.getUsers();
            Set<String> policyGroups = policy.getGroups();


            if (policyUsers != null &&
                    (policyUsers.contains(user.getUsername()) || policyUsers.contains(FieldName.ANONYMOUS_USER))) {
                permissions.add(policy.getPermission());
            }

            if (user.getGroupIds() != null) {
                for (String groupId : user.getGroupIds()) {
                    if (policyGroups != null && policyGroups.contains(groupId)) {
                        permissions.add(policy.getPermission());
                        break;
                    }
                }
            }
        }

        obj.setUserPermissions(permissions);
        return obj;
    }

}
