package com.appsmith.server.migrations.db.ce;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.QApplication;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@ChangeUnit(order = "005", id="create-application-detail-field-to-application-collection")
public class Migration005CreateApplicationDetailMigration {
    private final MongoTemplate mongoTemplate;

    public Migration005CreateApplicationDetailMigration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void demoRollbackExecution() {
    }

    @Execution
    public void executeMigration() {
        Update update = new Update();
        update.set(fieldName(QApplication.application.unpublishedApplicationDetail), new Object());
        update.set(fieldName(QApplication.application.publishedApplicationDetail), new Object());
        mongoTemplate.updateMulti(new Query(), update, Application.class);
    }
}
