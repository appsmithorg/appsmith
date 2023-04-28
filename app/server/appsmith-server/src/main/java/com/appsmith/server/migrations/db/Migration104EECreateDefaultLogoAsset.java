package com.appsmith.server.migrations.db;

import com.appsmith.external.models.QBaseDomain;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Asset;
import com.appsmith.server.domains.QAsset;
import com.appsmith.server.domains.QTenant;
import com.appsmith.server.domains.Tenant;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.MediaType;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.time.Instant;

import static com.appsmith.server.domains.TenantConfiguration.APPSMITH_DEFAULT_LOGO;
import static com.appsmith.server.domains.TenantConfiguration.ASSET_PREFIX;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@ChangeUnit(order = "104-EE", id="create-default-appsmith-logo-asset", author = "")
@RequiredArgsConstructor
@Slf4j
public class Migration104EECreateDefaultLogoAsset {

    private final MongoTemplate mongoTemplate;

    private final String logoPath = "appsmith-server/src/main/resources/images/appsmith-logo-full.png";

    @RollbackExecution
    public void rollBackExecution() {
    }

    @Execution
    public void createDefaultLogoAsset() {
        // For airgap enabled instances as the public internet is not available we need to remove the internet dependency
        // for default Appsmith logo for email templates.
        Query defaultAppsmithLogoQuery = new Query();
        defaultAppsmithLogoQuery.addCriteria(Criteria.where(fieldName(QAsset.asset.name)).is(APPSMITH_DEFAULT_LOGO));
        Asset defaultLogoAsset = mongoTemplate.findOne(defaultAppsmithLogoQuery, Asset.class);
        if (defaultLogoAsset == null) {
            defaultLogoAsset = createAsset(logoPath);
            if (defaultLogoAsset == null) {
                // Abort migration in case reading and saving the asset failed for IOException
                return;
            }
            defaultLogoAsset = mongoTemplate.save(defaultLogoAsset);
        }
        // Attach asset prefix to match the naming conventions for asset urls.
        String defaultLogoSpec = ASSET_PREFIX + defaultLogoAsset.getId();

        String whiteLabelLogoFieldName
            = fieldName(QTenant.tenant.tenantConfiguration) + "." + fieldName(QTenant.tenant.tenantConfiguration.whiteLabelLogo);

        Query query = new Query();
        query.addCriteria(
            Criteria.where(fieldName(QTenant.tenant.tenantConfiguration)).exists(true)
                .andOperator(Criteria.where(whiteLabelLogoFieldName).exists(false))
        );

        Update update = new Update();
        update.set(fieldName(QTenant.tenant.tenantConfiguration) + "." + fieldName(QTenant.tenant.tenantConfiguration.whiteLabelLogo), defaultLogoSpec);
        // Ideally we expect single update as the multi-tenancy is not available, but this makes sure to provide a
        // fallback for all the tenants once multi-tenancy is introduced
        mongoTemplate.updateMulti(query, update, Tenant.class);
    }

    private Asset createAsset(String logoPath) {
        byte[] imageData;
        try {
            imageData = FileUtils.readFileToByteArray(new File(logoPath));
        } catch(IOException e) {
            log.debug("Unable to read file with error: {}", e.getMessage());
            return null;
        }
        Asset defaultLogoAsset = new Asset(MediaType.IMAGE_PNG, imageData, APPSMITH_DEFAULT_LOGO);
        defaultLogoAsset.setCreatedAt(Instant.now());
        defaultLogoAsset.setUpdatedAt(Instant.now());
        return defaultLogoAsset;
    }
}
