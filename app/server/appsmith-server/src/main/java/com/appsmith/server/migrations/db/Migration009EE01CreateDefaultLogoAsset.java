package com.appsmith.server.migrations.db;

import com.appsmith.server.domains.Asset;
import com.appsmith.server.domains.QTenant;
import com.appsmith.server.domains.Tenant;
import io.mongock.api.annotations.ChangeUnit;
import io.mongock.api.annotations.Execution;
import io.mongock.api.annotations.RollbackExecution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

@ChangeUnit(order = "009-ee-01", id = "create-default-appsmith-logo-asset", author = "")
@RequiredArgsConstructor
@Slf4j
public class Migration009EE01CreateDefaultLogoAsset {

    private final MongoTemplate mongoTemplate;

    private final String logoPath = "images/appsmith-logo-full.png";

    @RollbackExecution
    public void rollBackExecution() {}

    @Execution
    public void createDefaultLogoAsset() {
        // For airgap enabled instances as the public internet is not available we need to remove the internet
        // dependency
        // for default Appsmith logo for email templates.
        Query defaultAppsmithLogoQuery = new Query();
        defaultAppsmithLogoQuery.addCriteria(Criteria.where(Asset.Fields.name).is(APPSMITH_DEFAULT_LOGO));
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

        String whiteLabelLogoFieldName =
                Tenant.Fields.tenantConfiguration + "." + fieldName(QTenant.tenant.tenantConfiguration.whiteLabelLogo);

        Query query = new Query();
        query.addCriteria(Criteria.where(Tenant.Fields.tenantConfiguration)
                .exists(true)
                .andOperator(Criteria.where(whiteLabelLogoFieldName).exists(false)));

        Update update = new Update();
        update.set(
                Tenant.Fields.tenantConfiguration + "." + fieldName(QTenant.tenant.tenantConfiguration.whiteLabelLogo),
                defaultLogoSpec);
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
        } catch (IOException e) {
            log.debug("Unable to read file with error: {}", e.getMessage());
            return null;
        }
        Asset defaultLogoAsset = new Asset(MediaType.IMAGE_PNG, imageData, APPSMITH_DEFAULT_LOGO);
        defaultLogoAsset.setCreatedAt(Instant.now());
        defaultLogoAsset.setUpdatedAt(Instant.now());
        return defaultLogoAsset;
    }
}
