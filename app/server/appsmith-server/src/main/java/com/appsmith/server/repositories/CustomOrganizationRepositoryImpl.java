package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.QOrganization;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Component
@Slf4j
public class CustomOrganizationRepositoryImpl extends BaseAppsmithRepositoryImpl<Organization>
        implements CustomOrganizationRepository {

    public CustomOrganizationRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Mono<Organization> findByName(String name, AclPermission aclPermission) {
        Criteria nameCriteria = where(fieldName(QOrganization.organization.name)).is(name);

        return queryOne(List.of(nameCriteria), aclPermission);
    }

    @Override
    public Flux<Organization> findByIdsIn(Set<String> orgIds, AclPermission aclPermission, Sort sort) {
        Criteria orgIdsCriteria = where(fieldName(QOrganization.organization.id)).in(orgIds);

        return queryAll(List.of(orgIdsCriteria), aclPermission, sort);
    }

    @Override
    public Mono<Long> nextSlugNumber(String slugPrefix) {
        final String slugField = fieldName(QOrganization.organization.slug);
        final Query slugPrefixQuery = query(where(slugField).regex("^" + slugPrefix + "\\d*$"));
        slugPrefixQuery.fields().include(slugField);
        return mongoOperations
                .find(slugPrefixQuery, Organization.class)
                .map(Organization::getSlug)
                .collect(Collectors.toSet())
                .map(slugs -> {
                    if (slugs.isEmpty() || !slugs.contains(slugPrefix)) {
                        return 0L;
                    }

                    long number = 1L;
                    while (slugs.contains(slugPrefix + number)) {
                        ++number;
                    }

                    return number;
                });
    }

}
