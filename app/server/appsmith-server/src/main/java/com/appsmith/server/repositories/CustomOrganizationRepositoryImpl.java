package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.QOrganization;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.List;

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
        Criteria nameCriterita = where(fieldName(QOrganization.organization.name)).is(name);

        return queryOne(List.of(nameCriterita), aclPermission);
    }

    @Override
    public Mono<Organization> findByIdAndPluginsPluginId(String organizationId, String pluginId, AclPermission aclPermission) {
        Criteria idCriteria = where(fieldName(QOrganization.organization.id)).is(organizationId);
        Criteria pluginIdCriteria = where(fieldName(QOrganization.organization.plugins.any().pluginId)).is(pluginId);

        return queryOne(List.of(idCriteria, pluginIdCriteria), aclPermission);
    }
}
