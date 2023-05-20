package com.appsmith.server.migrations.db;

import com.appsmith.server.domains.Asset;
import com.appsmith.server.domains.QAsset;
import com.appsmith.server.domains.QTenant;
import com.appsmith.server.domains.Tenant;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.Objects;

import static com.appsmith.server.domains.TenantConfiguration.APPSMITH_DEFAULT_LOGO;
import static com.appsmith.server.domains.TenantConfiguration.ASSET_PREFIX;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@ChangeUnit(order = "108-EE", id="update-default-appsmith-logo-asset", author = "")
@RequiredArgsConstructor
@Slf4j
public class Migration108EEUpdateDefaultAppsmithLogo {


    private final MongoTemplate mongoTemplate;

    private final String logoPath = "images/appsmith-logo-no-margin.png";

    @RollbackExecution
    public void rollBackExecution() {
    }

    @Execution
    public void updateDefaultLogoAsset() {

        // 1. Create new asset from the local file
        // 2. Remove existing default asset if present
        // 3. Save the asset created in Step1 to DB
        // 4. Update tenant configuration to either replace or add asset ref for logo
        Asset defaultLogoAsset = createAsset(logoPath);
        if (defaultLogoAsset == null) {
            // Abort migration in case reading and saving the asset failed for IOException
            return;
        }
        // For airgap enabled instances as the public internet is not available we need to remove the internet dependency
        // for default Appsmith logo for email templates.
        Query defaultAppsmithLogoQuery = new Query();
        defaultAppsmithLogoQuery.addCriteria(Criteria.where(fieldName(QAsset.asset.name)).is(APPSMITH_DEFAULT_LOGO));
        Asset existingDefaultAsset = mongoTemplate.findAndRemove(defaultAppsmithLogoQuery, Asset.class);

        defaultLogoAsset = mongoTemplate.save(defaultLogoAsset);
        // Attach asset prefix to match the naming conventions for asset urls.
        String defaultLogoSpec = ASSET_PREFIX + defaultLogoAsset.getId();

        String whiteLabelLogoFieldName
            = fieldName(QTenant.tenant.tenantConfiguration) + "." + fieldName(QTenant.tenant.tenantConfiguration.whiteLabelLogo);

        Query query = new Query();
        query.addCriteria(Criteria.where(fieldName(QTenant.tenant.tenantConfiguration)).exists(true));

        if (existingDefaultAsset != null && !StringUtils.isEmpty(existingDefaultAsset.getId())) {
            query.addCriteria(Criteria.where(whiteLabelLogoFieldName).is(ASSET_PREFIX + existingDefaultAsset.getId()));
        } else {
            query.addCriteria(Criteria.where(whiteLabelLogoFieldName).exists(false));
        }

        Update update = new Update();
        update.set(whiteLabelLogoFieldName, defaultLogoSpec);
        // Ideally we expect single update as the multi-tenancy is not available, but this makes sure to provide a
        // fallback for all the tenants once multi-tenancy is introduced
        mongoTemplate.updateMulti(query, update, Tenant.class);
    }

    private Asset createAsset(String logoPath) {
        byte[] imageData;
        try {
            // In the absence of ClassLoader we were getting file not found at given path.
            // By default, Spring Boot will use the thread context class loader to load resources. However, as the
            // application is running the Mongock migration which is running in a different context,
            // we have to use a different class loader to access the resource.
            ClassLoader classLoader = getClass().getClassLoader();
            InputStream inputStream = classLoader.getResourceAsStream(logoPath);
            imageData = Objects.requireNonNull(inputStream).readAllBytes();
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

