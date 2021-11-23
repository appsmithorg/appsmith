package com.appsmith.server.repositories;

import com.appsmith.server.domains.QTheme;
import com.appsmith.server.domains.Theme;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

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
    public Flux<Theme> getApplicationThemes(String applicationId) {
        Criteria criteria = new Criteria().orOperator(
                Criteria.where(fieldName(QTheme.theme.applicationId)).exists(false),
                Criteria.where(fieldName(QTheme.theme.applicationId)).is(applicationId)
        );
        return queryAll(List.of(criteria), null);
    }
}
