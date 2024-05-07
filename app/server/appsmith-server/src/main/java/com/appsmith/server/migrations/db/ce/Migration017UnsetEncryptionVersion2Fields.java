package com.appsmith.server.migrations.db.ce;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.server.constants.FieldName;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.core.query.UpdateDefinition;

import static com.appsmith.external.constants.CommonFieldName.CLIENT_SECRET;
import static com.appsmith.external.constants.CommonFieldName.REFRESH_TOKEN;
import static com.appsmith.external.constants.CommonFieldName.TOKEN;
import static com.appsmith.external.constants.CommonFieldName.TOKEN_RESPONSE;
import static com.appsmith.server.constants.ce.FieldNameCE.PASSWORD;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

@Slf4j
@ChangeUnit(order = "017", id = "unset-not-encrypted-encryption-version-2-fields", author = " ")
public class Migration017UnsetEncryptionVersion2Fields {

    private final MongoTemplate mongoTemplate;
    private static final int ENCRYPTION_VERSION = 2;
    private static final String ENCRYPTION_VERSION_FIELD_NAME = "encryptionVersion";
    private static final String DATASOURCE_CONFIGURATION_FIELD_NAME = Datasource.Fields.datasourceConfiguration;
    private static final String AUTHENTICATION_FIELD_NAME = DatasourceConfiguration.Fields.authentication;
    private static final String DELIMITER = ".";

    private static final String AUTHENTICATION_QUALIFIED_NAME =
            DATASOURCE_CONFIGURATION_FIELD_NAME + DELIMITER + AUTHENTICATION_FIELD_NAME;
    private static final String AUTHENTICATION_RESPONSE_QUALIFIED_NAME =
            AUTHENTICATION_QUALIFIED_NAME + DELIMITER + AuthenticationDTO.Fields.authenticationResponse;
    private static final String PASSWORD_QUALIFIED_NAME = AUTHENTICATION_QUALIFIED_NAME + DELIMITER + PASSWORD;
    private static final String CLIENT_SECRET_QUALIFIED_NAME =
            AUTHENTICATION_RESPONSE_QUALIFIED_NAME + DELIMITER + CLIENT_SECRET;
    private static final String TOKEN_QUALIFIED_NAME = AUTHENTICATION_RESPONSE_QUALIFIED_NAME + DELIMITER + TOKEN;
    private static final String REFRESH_TOKEN_QUALIFIED_NAME =
            AUTHENTICATION_RESPONSE_QUALIFIED_NAME + DELIMITER + REFRESH_TOKEN;
    private static final String TOKEN_RESPONSE_QUALIFIED_NAME =
            AUTHENTICATION_RESPONSE_QUALIFIED_NAME + DELIMITER + TOKEN_RESPONSE;

    public Migration017UnsetEncryptionVersion2Fields(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @RollbackExecution
    public void rollbackExecution() {
        // We're handling rollbacks using marker fields, so we don't need to implement this
    }

    @Execution
    public void executeMigration(MongoOperations mongoOperations) {

        Query datasourcesToUpdateQuery = query(findDatasourceToUnsetFieldsIn());

        UpdateDefinition updateQuery = new Update()
                .unset(PASSWORD_QUALIFIED_NAME)
                .unset(REFRESH_TOKEN_QUALIFIED_NAME)
                .unset(TOKEN_QUALIFIED_NAME)
                .unset(CLIENT_SECRET_QUALIFIED_NAME)
                .unset(TOKEN_RESPONSE_QUALIFIED_NAME)
                .unset(ENCRYPTION_VERSION_FIELD_NAME)
                .set(Datasource.Fields.isConfigured, Boolean.FALSE);
        mongoOperations.updateMulti(datasourcesToUpdateQuery, updateQuery, Datasource.class);
    }

    private Criteria findDatasourceToUnsetFieldsIn() {

        return new Criteria()
                .andOperator(
                        // Older check for deleted
                        new Criteria()
                                .orOperator(
                                        where(FieldName.DELETED).exists(false),
                                        where(FieldName.DELETED).is(false)),
                        // New check for deleted
                        new Criteria()
                                .orOperator(
                                        where(FieldName.DELETED_AT).exists(false),
                                        where(FieldName.DELETED_AT).is(null)),
                        new Criteria()
                                .andOperator(
                                        where(ENCRYPTION_VERSION_FIELD_NAME).exists(true),
                                        where(ENCRYPTION_VERSION_FIELD_NAME).is(ENCRYPTION_VERSION)));
    }
}
