package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.QTheme;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.bridge.Bridge;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.springframework.data.mongodb.core.query.Criteria.where;

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
        throw new ex.Marker("getApplicationThemes"); /*
        Criteria appThemeCriteria =
                Criteria.where("applicationId").is(applicationId);
        Criteria systemThemeCriteria =
                Criteria.where("isSystemTheme").is(Boolean.TRUE);
        Criteria criteria = new Criteria().orOperator(appThemeCriteria, systemThemeCriteria);
        return queryBuilder().criteria(criteria).permission(aclPermission).all();*/
    }

    @Override
    public List<Theme> getSystemThemes() {
        return Collections.emptyList(); /*
        Criteria systemThemeCriteria =
                Criteria.where("isSystemTheme").is(Boolean.TRUE);
        return queryBuilder()
                .criteria(systemThemeCriteria)
                .permission(AclPermission.READ_THEMES)
                .all();*/
    }

    @Override
    public Optional<Theme> getSystemThemeByName(String themeName) {
        return queryBuilder()
                .spec(Bridge.conditioner()
                        .eqIgnoreCase(fieldName(QTheme.theme.name), themeName)
                        .isTrue(fieldName(QTheme.theme.isSystemTheme)))
                .permission(AclPermission.READ_THEMES)
                .one();
    }

    private Optional<Boolean> archiveThemeByCriteria(Criteria criteria) {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> auth.getPrincipal())
                .flatMap(principal -> Mono.justOrEmpty(getAllPermissionGroupsForUser((User) principal)))
                .flatMap(permissionGroups -> {
                    Criteria permissionCriteria = userAcl(permissionGroups, AclPermission.MANAGE_THEMES);

                    Update update = new Update();
                    update.set("deletedAt", Instant.now());
                    return updateByCriteria(List.of(criteria, permissionCriteria), update, null);
                })
                .map(updateResult -> updateResult.getModifiedCount() > 0)
                .blockOptional();
    }

    @Override
    public Optional<Boolean> archiveByApplicationId(String applicationId) {
        return archiveThemeByCriteria(where("applicationId").is(applicationId));
    }

    @Override
    public Optional<Boolean> archiveDraftThemesById(String editModeThemeId, String publishedModeThemeId) {
        Criteria criteria = where("id")
                .in(editModeThemeId, publishedModeThemeId)
                .and("isSystemTheme")
                .is(false);
        return archiveThemeByCriteria(criteria);
    }
}
