package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.helpers.CollectionUtils;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Component
@Slf4j
public class CustomThemeRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Theme> implements CustomThemeRepositoryCE {
    public CustomThemeRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public Flux<Theme> getApplicationThemes(String applicationId, AclPermission aclPermission) {
        BridgeQuery<Theme> appThemeCriteria = Bridge.equal(Theme.Fields.applicationId, applicationId);
        BridgeQuery<Theme> systemThemeCriteria = Bridge.isTrue(Theme.Fields.isSystemTheme);
        return queryBuilder()
                .criteria(Bridge.or(appThemeCriteria, systemThemeCriteria))
                .permission(aclPermission)
                .all();
    }

    @Override
    public Flux<Theme> getSystemThemes() {
        return queryBuilder()
                .criteria(Bridge.isTrue(Theme.Fields.isSystemTheme))
                .permission(AclPermission.READ_THEMES)
                .all();
    }

    @Override
    public Mono<Theme> getSystemThemeByName(String themeName) {
        return queryBuilder()
                .criteria(Bridge.equalIgnoreCase(Theme.Fields.name, themeName).isTrue(Theme.Fields.isSystemTheme))
                .permission(AclPermission.READ_THEMES)
                .one();
    }

    private Mono<Boolean> archiveThemeByCriteria(BridgeQuery<Theme> criteria) {
        return queryBuilder()
                .criteria(criteria)
                .permission(AclPermission.MANAGE_THEMES)
                .updateAll(new Update().set(Theme.Fields.deletedAt, Instant.now()))
                .map(count -> count > 0);
    }

    @Override
    public Mono<Boolean> archiveByApplicationId(String applicationId) {
        return archiveThemeByCriteria(Bridge.equal(Theme.Fields.applicationId, applicationId));
    }

    @Override
    public Mono<Boolean> archiveDraftThemesById(String editModeThemeId, String publishedModeThemeId) {
        BridgeQuery<Theme> criteria = Bridge.<Theme>in(
                        Theme.Fields.id, CollectionUtils.ofNonNulls(editModeThemeId, publishedModeThemeId))
                .isFalse(Theme.Fields.isSystemTheme);
        return archiveThemeByCriteria(criteria);
    }
}
