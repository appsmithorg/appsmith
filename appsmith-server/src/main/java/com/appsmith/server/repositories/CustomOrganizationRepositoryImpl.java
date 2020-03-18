package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.domains.QOrganization;
import com.appsmith.server.domains.User;
import lombok.extern.slf4j.Slf4j;
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
public class CustomOrganizationRepositoryImpl extends BaseAppsmithRepositoryImpl<Organization>
        implements CustomOrganizationRepository {

    public CustomOrganizationRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Mono<Organization> findByName(String name, AclPermission aclPermission) {
        log.debug("Going to find organization by Name: {}", name);
        return ReactiveSecurityContextHolder.getContext()
                .switchIfEmpty(Mono.error(new Exception("Can't find user")))
                .map(ctx -> ctx.getAuthentication())
                .flatMap(auth -> {
                    User user = (User) auth.getPrincipal();
                    Query query = new Query();
                    query.addCriteria(where(fieldName(QOrganization.organization.name)).is(name));
                    query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(user, aclPermission)));

                    return mongoOperations.query(Organization.class)
                            .matching(query)
                            .one();
                });
    }

    @Override
    public Mono<Organization> findByIdAndPluginsPluginId(String organizationId, String pluginId, AclPermission aclPermission) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .flatMap(auth -> {
                    User user = (User) auth.getPrincipal();
                    Query query = new Query(getIdCriteria(organizationId));
                    query.addCriteria(where(fieldName(QOrganization.organization.plugins.any().pluginId)).is(pluginId));
                    query.addCriteria(new Criteria().andOperator(notDeleted(), userAcl(user, aclPermission)));

                    return mongoOperations.query(Organization.class)
                            .matching(query)
                            .one();
                });

    }
}
