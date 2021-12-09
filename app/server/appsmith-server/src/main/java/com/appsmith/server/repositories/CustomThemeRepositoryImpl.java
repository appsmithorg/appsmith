package com.appsmith.server.repositories;

import com.appsmith.server.domains.QTheme;
import com.appsmith.server.domains.Theme;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
@Slf4j
public class CustomThemeRepositoryImpl extends BaseAppsmithRepositoryImpl<Theme> implements CustomThemeRepository {
    public CustomThemeRepositoryImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter) {
        super(mongoOperations, mongoConverter);
    }

    /**
     * Returns all the themes under an application or system themes which do not have applicationId set
     * @param applicationId DB id of the application object
     * @return Flux of themes
     */
    @Override
    public Mono<Theme> getCustomizedTheme(String applicationId) {
        Criteria criteria = Criteria.where(fieldName(QTheme.theme.applicationId)).is(applicationId);
        return queryOne(List.of(criteria), null);
    }

    @Override
    public Flux<Theme> getSystemThemes() {
        Criteria criteria = Criteria.where(fieldName(QTheme.theme.applicationId)).exists(false);
        return queryAll(List.of(criteria), null);
    }

    @Override
<<<<<<< HEAD
    public Mono<Theme> findBySlug(String themeSlug) {
        Criteria criteria = Criteria.where(fieldName(QTheme.theme.slug)).is(themeSlug);
=======
    public Mono<Theme> findSystemThemeBySlug(String themeSlug) {
        Criteria criteria = Criteria.where(fieldName(QTheme.theme.slug)).is(themeSlug)
                .and(fieldName(QTheme.theme.applicationId)).exists(false);
>>>>>>> 5c03a465d8f3dfb1530aa5afb4c1012074d425aa
        return queryOne(List.of(criteria), null);
    }
}
