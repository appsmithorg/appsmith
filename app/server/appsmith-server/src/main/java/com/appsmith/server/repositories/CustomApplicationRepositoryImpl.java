package com.appsmith.server.repositories;

import com.appsmith.server.constants.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.domains.User;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomApplicationRepositoryImpl extends BaseAppsmithRepositoryImpl<Application>
        implements CustomApplicationRepository {

    @Autowired
    public CustomApplicationRepositoryImpl(@NonNull ReactiveMongoOperations mongoOperations,
                                           @NonNull MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    protected Criteria getIdCriteria(Object id) {
        return where(fieldName(QApplication.application.id)).is(id);
    }

    @Override
    public Mono<Application> findByIdAndOrganizationId(String id, String orgId, AclPermission permission) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .flatMap(auth -> {
                    User user = (User) auth.getPrincipal();
                    Query query = new Query(getIdCriteria(id));
                    query.addCriteria(where(fieldName(QApplication.application.organizationId)).is(orgId));
                    query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(user, permission)));

                    return mongoOperations.query(Application.class)
                            .matching(query)
                            .one();
                });
    }

    @Override
    public Mono<Application> findByName(String name, AclPermission permission) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> {
                   User user = (User) principal;
                   Query query = new Query(where(fieldName(QApplication.application.name)).is(name));
                   query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(user, permission)));

                   return mongoOperations.query(Application.class)
                           .matching(query)
                           .one();
                });
    }
}
