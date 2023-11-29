package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Group;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;

import java.util.List;
import java.util.Optional;

import static org.springframework.data.mongodb.core.query.Criteria.where;

@Slf4j
public class CustomGroupRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Group> implements CustomGroupRepositoryCE {

    public CustomGroupRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public List<Group> getAllByWorkspaceId(String workspaceId) {
        Criteria workspaceIdCriteria = where("workspaceId").is(workspaceId);

        return queryAll(List.of(workspaceIdCriteria), Optional.empty());
    }
}
