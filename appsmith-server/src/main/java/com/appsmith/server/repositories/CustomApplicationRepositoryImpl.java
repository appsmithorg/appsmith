package com.appsmith.server.repositories;

import com.appsmith.server.constants.Entity;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.User;
import com.appsmith.server.services.AclEntity;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
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

    protected Criteria userAcl(User user, String permission) {
        Set<String> flatPermissions = user.getFlatPermissions();
        String entity = Entity.APPLICATIONS;
//        flatPermissions.stream()
//                .filter(flatPerm -> )
        return new Criteria().orOperator(
                where("acl.users").all(user.getUsername()),
                where("acl.groups").all(user.getGroupIds())
        );
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
                    query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(user, "read")));

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
