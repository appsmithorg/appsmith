package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.QApplication;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.List;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;
import static org.springframework.data.mongodb.core.query.Update.update;

@RequiredArgsConstructor
@ChangeUnit(order = "023", id = "rename-appPositioning-property")
public class Migration023RenameAppPositioningProperty {
    private final MongoTemplate mongoTemplate;

    @RollbackExecution
    public void rollbackExecution() {}

    @Execution
    public void executeMigration() {

        Criteria unpublishedAppPositioningCriteria = where(
                        fieldName(QApplication.application.unpublishedApplicationDetail) + "."
                                + fieldName(QApplication.application.unpublishedApplicationDetail.appPositioning))
                .exists(true);

        Criteria publishedAppPositioningCriteria = where(fieldName(QApplication.application.publishedApplicationDetail)
                        + "." + fieldName(QApplication.application.publishedApplicationDetail.appPositioning))
                .exists(true);

        final Query publishedApplicationDetailQuery =
                query((new Criteria()).andOperator(publishedAppPositioningCriteria));

        List<Application> publishedApplicationDetailApplicationsList =
                mongoTemplate.find(publishedApplicationDetailQuery, Application.class);

        final Query unpublishedApplicationDetailQuery =
                query((new Criteria()).andOperator(unpublishedAppPositioningCriteria));

        publishedApplicationDetailQuery
                .fields()
                .include(fieldName(QApplication.application.id))
                .include(fieldName(QApplication.application.publishedApplicationDetail) + "."
                        + fieldName(QApplication.application.publishedApplicationDetail.appPositioning));

        unpublishedApplicationDetailQuery
                .fields()
                .include(fieldName(QApplication.application.id))
                .include(fieldName(QApplication.application.unpublishedApplicationDetail) + "."
                        + fieldName(QApplication.application.publishedApplicationDetail.appPositioning));

        List<Application> unpublishedApplicationDetailApplicationsList =
                mongoTemplate.find(unpublishedApplicationDetailQuery, Application.class);

        for (final Application application : unpublishedApplicationDetailApplicationsList) {
            final Update update = new Update();

            Application.AppPositioning unpublishedAppPositioning =
                    application.getUnpublishedApplicationDetail().getAppPositioning();
            if (unpublishedAppPositioning != null) {
                update.set(
                        fieldName(QApplication.application.unpublishedApplicationDetail) + "."
                                + fieldName(QApplication.application.unpublishedApplicationDetail.layoutSystem),
                        unpublishedAppPositioning);
                update.unset(fieldName(QApplication.application.unpublishedApplicationDetail) + "."
                        + fieldName(QApplication.application.unpublishedApplicationDetail.appPositioning));
            }

            mongoTemplate.updateFirst(
                    query(where(fieldName(QApplication.application.id)).is(application.getId())),
                    update,
                    Application.class);
        }

        for (final Application application : publishedApplicationDetailApplicationsList) {
            final Update update = new Update();

            Application.AppPositioning publishedAppPositioning =
                    application.getPublishedApplicationDetail().getAppPositioning();
            if (publishedAppPositioning != null) {
                update.set(
                        fieldName(QApplication.application.publishedApplicationDetail) + "."
                                + fieldName(QApplication.application.publishedApplicationDetail.layoutSystem),
                        publishedAppPositioning);
                update.unset(fieldName(QApplication.application.publishedApplicationDetail) + "."
                        + fieldName(QApplication.application.publishedApplicationDetail.appPositioning));
            }

            mongoTemplate.updateFirst(
                    query(where(fieldName(QApplication.application.id)).is(application.getId())),
                    update,
                    Application.class);
        }
    }
}
