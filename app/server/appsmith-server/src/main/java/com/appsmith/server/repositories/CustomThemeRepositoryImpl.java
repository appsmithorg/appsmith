package com.appsmith.server.repositories;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.repositories.ce.CustomThemeRepositoryCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.Optional;

@Component
@Slf4j
public class CustomThemeRepositoryImpl extends CustomThemeRepositoryCEImpl implements CustomThemeRepository {
    public CustomThemeRepositoryImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<Theme> getPersistedThemesForApplication(String applicationId, Optional<AclPermission> aclPermission) {
        Criteria appThemeCriteria = Criteria.where(Theme.Fields.applicationId).is(applicationId);
        Criteria notSystemThemeCriteria =
                Criteria.where(Theme.Fields.isSystemTheme).ne(Boolean.TRUE);
        Criteria criteria = new Criteria().andOperator(appThemeCriteria, notSystemThemeCriteria);
        return queryBuilder()
                .criteria(criteria)
                .permission(aclPermission.orElse(null))
                .all();
    }
}
