package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.helpers.ce.bridge.BridgeQuery;
import com.appsmith.server.helpers.ce.bridge.BridgeUpdate;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

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
    public List<Theme> getApplicationThemes(String applicationId, AclPermission aclPermission) {
        BridgeQuery<Theme> appThemeCriteria = Bridge.equal(Theme.Fields.applicationId, applicationId);
        BridgeQuery<Theme> systemThemeCriteria = Bridge.isTrue(Theme.Fields.isSystemTheme);
        return queryBuilder()
                .criteria(Bridge.or(appThemeCriteria, systemThemeCriteria))
                .permission(aclPermission)
                .all();
    }

    @Override
    public List<Theme> getSystemThemes() {
        return queryBuilder()
                .criteria(Bridge.isTrue(Theme.Fields.isSystemTheme))
                .permission(AclPermission.READ_THEMES)
                .all();
    }

    @Override
    public Optional<Theme> getSystemThemeByName(String themeName) {
        return queryBuilder()
                .criteria(Bridge.query()
                        .eqIgnoreCase(Theme.Fields.name, themeName)
                        .isTrue(Theme.Fields.isSystemTheme))
                .permission(AclPermission.READ_THEMES)
                .one();
    }

    public Optional<Boolean> archiveThemeByCriteria(BridgeQuery criteria) {
        BridgeUpdate update = Bridge.update();
        update.set(Theme.Fields.deletedAt, Instant.now());
        return Optional.of(queryBuilder()
                        .criteria(criteria)
                        .permission(AclPermission.MANAGE_THEMES)
                        .updateAll(update)
                > 0);
    }

    @Modifying
    @Transactional
    @Override
    public Optional<Boolean> archiveByApplicationId(String applicationId) {
        return archiveThemeByCriteria(Bridge.equal(Theme.Fields.applicationId, applicationId));
    }

    @Modifying
    @Transactional
    @Override
    public Optional<Boolean> archiveDraftThemesById(String editModeThemeId, String publishedModeThemeId) {
        return archiveThemeByCriteria(Bridge.in(Theme.Fields.id, List.of(editModeThemeId, publishedModeThemeId))
                .isFalse(Theme.Fields.isSystemTheme));
    }
}
