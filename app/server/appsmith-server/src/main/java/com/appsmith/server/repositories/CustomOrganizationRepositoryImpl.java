package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.QOrganization;
import com.appsmith.server.helpers.PolicyUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomOrganizationRepositoryImpl extends BaseAppsmithRepositoryImpl<Organization>
        implements CustomOrganizationRepository {

    private final PolicyUtils policyUtils;

    public CustomOrganizationRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, PolicyUtils policyUtils) {
        super(mongoOperations, mongoConverter, policyUtils);
        this.policyUtils = policyUtils;
    }

    @Override
    public Mono<Organization> findByName(String name, AclPermission aclPermission) {
        Criteria nameCriteria = where(fieldName(QOrganization.organization.name)).is(name);

        return queryOne(List.of(nameCriteria), aclPermission);
    }

    @Override
    public Mono<Organization> findByIdAndPluginsPluginId(String organizationId, String pluginId, AclPermission aclPermission) {
        Criteria idCriteria = where(fieldName(QOrganization.organization.id)).is(organizationId);
        Criteria pluginIdCriteria = where(fieldName(QOrganization.organization.plugins.any().pluginId)).is(pluginId);

        return queryOne(List.of(idCriteria, pluginIdCriteria), aclPermission);
    }

    @Override
    public Flux<Organization> findByIdsIn(Set<String> orgIds, AclPermission aclPermission) {
        Criteria orgIdsCriteria = where(fieldName(QOrganization.organization.id)).in(orgIds);
        return queryAll(List.of(orgIdsCriteria), aclPermission);
    }

    @Override
    public Mono<Organization> findById(String id, AclPermission aclPermission) {
        Criteria idCriteria = where(fieldName(QOrganization.organization.id)).is(id);

        return queryOne(List.of(idCriteria), aclPermission);
    }
}
