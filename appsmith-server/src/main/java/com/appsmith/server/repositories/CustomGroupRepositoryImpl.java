package com.appsmith.server.repositories;

import com.appsmith.server.domains.Group;
import com.appsmith.server.domains.QApplication;
import com.appsmith.server.domains.QGroup;
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

    public CustomGroupRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    @Override
    public Flux<Group> getAllByOrganizationId(String organizationId) {
        Criteria orgIdCriteria = where(fieldName(QGroup.group.organizationId)).is(organizationId);

        return queryAll(List.of(orgIdCriteria), null);
    }
}
