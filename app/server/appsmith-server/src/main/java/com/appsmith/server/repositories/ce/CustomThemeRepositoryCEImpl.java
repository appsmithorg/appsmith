package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.ce.bridge.BUpdate;
import com.appsmith.server.helpers.ce.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static com.appsmith.server.helpers.ce.bridge.Bridge.bridge;
import static org.springframework.data.mongodb.core.query.Criteria.where;

@Component
@Slf4j
public class CustomThemeRepositoryCEImpl extends BaseAppsmithRepositoryImpl<Theme> implements CustomThemeRepositoryCE {

    // @Autowired
    // @Lazy
    // private ThemeRepository repository;

    public CustomThemeRepositoryCEImpl(
            ReactiveMongoOperations mongoOperations,
            MongoConverter mongoConverter,
            CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    @Override
    public List<Theme> getApplicationThemes(String applicationId, AclPermission aclPermission) {
        return queryBuilder()
                .criteria(bridge().equal(Theme.Fields.applicationId, applicationId)
                        .isTrue(Theme.Fields.isSystemTheme))
                .permission(aclPermission)
                .all();
    }

    @Override
    public List<Theme> getSystemThemes() {
        return queryBuilder()
                .criteria(bridge().isTrue(Theme.Fields.isSystemTheme))
                .permission(AclPermission.READ_THEMES)
                .all();
    }

    @Override
    public Optional<Theme> getSystemThemeByName(String themeName) {
        return queryBuilder()
                .criteria(bridge().eqIgnoreCase(Theme.Fields.name, themeName).isTrue(Theme.Fields.isSystemTheme))
                .permission(AclPermission.READ_THEMES)
                .one();
    }

    private Optional<Boolean> archiveThemeByCriteria(Criteria criteria) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> Mono.justOrEmpty(getAllPermissionGroupsForUser((User) principal)))
                .map(permissionGroups -> {
                    Criteria permissionCriteria = userAcl(permissionGroups, AclPermission.MANAGE_THEMES);

                    BUpdate update = Bridge.update();
                    update.set(Theme.Fields.deletedAt, Instant.now());
                    return queryBuilder().criteria(criteria, permissionCriteria).updateAll(update);
                })
                .map(count -> count > 0)
                .blockOptional();
    }

    @Override
    public Optional<Boolean> archiveByApplicationId(String applicationId) {
        return archiveThemeByCriteria(where(Theme.Fields.applicationId).is(applicationId));
    }

    @Override
    public Optional<Boolean> archiveDraftThemesById(String editModeThemeId, String publishedModeThemeId) {
        Criteria criteria = where(Theme.Fields.id)
                .in(editModeThemeId, publishedModeThemeId)
                .and(Theme.Fields.isSystemTheme)
                .is(false);
        return archiveThemeByCriteria(criteria);
    }
}
