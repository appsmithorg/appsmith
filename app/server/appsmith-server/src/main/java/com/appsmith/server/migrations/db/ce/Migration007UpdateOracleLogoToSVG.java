package com.appsmith.server.migrations.db.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Plugin;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.util.List;
import java.util.Set;

import static com.appsmith.external.constants.PluginConstants.PackageName.AMAZON_S3_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.DYNAMO_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.FIRESTORE_PLUGIN;
import static com.appsmith.external.constants.PluginConstants.PackageName.REDSHIFT_PLUGIN;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@ChangeUnit(order = "007", id="update-oracle-logo-to-svg", author = " ")
public class Migration007UpdateOracleLogoToSVG {
    private final MongoTemplate mongoTemplate;

    public Migration007UpdateOracleLogoToSVG(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollBackExecution() {
    }

    @Execution
    public void updateOracleLogoToSVG() {
        Plugin oraclePlugin = mongoTemplate.findOne(query(where("packageName").is("oracle-plugin")), Plugin.class);
        oraclePlugin.setIconLocation("https://s3.us-east-2.amazonaws.com/assets.appsmith.com/oracle.svg");
        mongoTemplate.save(oraclePlugin);
    }
}
