package com.appsmith.server.repositories;

import com.appsmith.server.constants.Entity;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Arn;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.AclHelper;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomApplicationRepositoryImpl implements CustomApplicationRepository {

    private final ReactiveMongoOperations mongoOperations;
    private final ReactiveMongoTemplate mongoTemplate;

    @Autowired
    public CustomApplicationRepositoryImpl(@NonNull ReactiveMongoOperations mongoOperations,
                                           ReactiveMongoTemplate mongoTemplate) {
        this.mongoOperations = mongoOperations;
        this.mongoTemplate = mongoTemplate;
    }

    protected Criteria notDeleted() {
        return new Criteria().orOperator(
                where("deleted").exists(false),
                where("deleted").is(false)
        );
    }

    protected Criteria userAcl(User user, String permission, String entity) {
        Map<String, Set<Arn>> flatPermissions = user.getFlatPermissions();
        String authorityToCheck = AclHelper.concatenatePermissionWithEntityName(permission, entity);
        Criteria criteria = new Criteria();
        flatPermissions.get(authorityToCheck).stream()
                .forEach(arn -> {
                    log.debug("Got ARN: {}", arn);
                    if (arn.getOrganizationId() != null && !arn.getOrganizationId().equals("*")) {
                        criteria.and("organizationId").is(arn.getOrganizationId());
                    }
                    if (arn.getEntityId() != null && !arn.getEntityId().equals("*")) {
                        criteria.and("id").is(arn.getEntityId());
                    }
//                    if (permission.equals(permSplit[0])) {
//                        // Extract arn from read::arn:appsmith:5da151714a020300041ae8fd:applications:*
//                        String arnStr = permSplit[1];
//                    }
                });

        return criteria;
//        return new Criteria().orOperator(
//                where("acl.users").all(user.getUsername()),
//                where("acl.groups").all(user.getGroupIds())
//        );
    }

    protected Criteria getIdCriteria(Object id) {
        return where("id").is(id);
    }

    @Override
    public Mono<Application> findByIdAndOrganizationId(String id, String orgId) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .flatMap(auth -> {
                    User user = (User) auth.getPrincipal();
                    Query query = new Query(getIdCriteria(id));
                    query.addCriteria(where("organizationId").is(orgId));
                    query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(user, "read", Entity.APPLICATIONS)));

                    return mongoOperations.query(Application.class)
                            .matching(query)
                            .one();
                });
    }

//    @Override
//    public Mono<Application> findByName(String name) {
//        Query query = new Query();
//        return Mono.empty();
//    }
}
