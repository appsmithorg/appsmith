package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Group;
import com.appsmith.server.domains.QGroup;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Flux;

import java.util.List;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public class CustomGroupRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Group>
        implements CustomGroupRepositoryCE {

    public CustomGroupRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Flux<Group> getAllByOrganizationId(String organizationId) {
        Criteria orgIdCriteria = where(fieldName(QGroup.group.organizationId)).is(organizationId);

        return queryAll(List.of(orgIdCriteria), null);
    }
}
