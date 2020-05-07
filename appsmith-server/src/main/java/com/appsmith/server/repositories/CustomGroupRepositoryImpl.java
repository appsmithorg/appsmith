package com.appsmith.server.repositories;

import com.appsmith.server.domains.Group;
import com.appsmith.server.domains.QGroup;
import com.appsmith.server.helpers.PolicyUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.List;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomGroupRepositoryImpl extends BaseAppsmithRepositoryImpl<Group>
        implements CustomGroupRepository {

    private final PolicyUtils policyUtils;

    public CustomGroupRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter, PolicyUtils policyUtils) {
        super(mongoOperations, mongoConverter, policyUtils);
        this.policyUtils = policyUtils;
    }

    @Override
    public Flux<Group> getAllByOrganizationId(String organizationId) {
        Criteria orgIdCriteria = where(fieldName(QGroup.group.organizationId)).is(organizationId);

        return queryAll(List.of(orgIdCriteria), null);
    }
}
