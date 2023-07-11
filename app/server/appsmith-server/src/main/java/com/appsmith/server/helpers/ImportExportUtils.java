package com.appsmith.server.helpers;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Application;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.data.mongodb.MongoTransactionException;
import org.springframework.transaction.TransactionException;

import java.util.Map;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;

@Slf4j
public class ImportExportUtils {

    /**
     * Method to provide non-cryptic and user-friendly error message with actionable input for Import-Export flows
     *
     * @param throwable Exception from which the user-friendly message needs to be extracted
     * @return Error message string
     */
    public static String getErrorMessage(Throwable throwable) {
        log.error("Error while importing the application, reason: {}", throwable.getMessage());
        // TODO provide actionable insights for different error messages generated from import-export flow
        // Filter out transactional error as these are cryptic and don't provide much info on the error
        return throwable instanceof TransactionException
                        || throwable instanceof MongoTransactionException
                        || throwable instanceof InvalidDataAccessApiUsageException
                ? ""
                : "Error: " + throwable.getMessage();
    }

    /**
     * This function will be used to sanitise datasource within the actionDTO
     *
     * @param actionDTO     for which the datasource needs to be sanitised as per import format expected
     * @param datasourceMap datasource id to name map
     * @param pluginMap     plugin id to name map
     * @param workspaceId   workspace in which the application supposed to be imported
     * @return
     */
    public static String sanitizeDatasourceInActionDTO(
            ActionDTO actionDTO,
            Map<String, String> datasourceMap,
            Map<String, String> pluginMap,
            String workspaceId,
            boolean isExporting) {

        if (actionDTO != null && actionDTO.getDatasource() != null) {

            Datasource ds = actionDTO.getDatasource();
            if (isExporting) {
                ds.setUpdatedAt(null);
            }
            if (ds.getId() != null) {
                // Mapping ds name in id field
                ds.setId(datasourceMap.get(ds.getId()));
                ds.setWorkspaceId(null);
                if (ds.getPluginId() != null) {
                    ds.setPluginId(pluginMap.get(ds.getPluginId()));
                }
                return ds.getId();
            } else {
                // This means we don't have regular datasource it can be simple REST_API and will also be used when
                // importing the action to populate the data
                ds.setWorkspaceId(workspaceId);
                ds.setPluginId(pluginMap.get(ds.getPluginId()));
                return "";
            }
        }

        return "";
    }

    public static void setPropertiesToExistingApplication(
            Application importedApplication, Application existingApplication) {
        importedApplication.setId(existingApplication.getId());
        // For the existing application we don't need to default
        // value of the flag
        // The isPublic flag has a default value as false and this
        // would be confusing to user
        // when it is reset to false during importing where the
        // application already is present in DB
        importedApplication.setIsPublic(null);
        importedApplication.setPolicies(null);
        // These properties are not present in the application when it is created, hence the initial commit
        // to git doesn't contain these keys and if we want to discard the changes, the function
        // copyNestedNonNullProperties ignore these properties and the changes are not discarded
        if (importedApplication.getUnpublishedApplicationDetail() == null) {
            existingApplication.setUnpublishedApplicationDetail(null);
        }
        if (importedApplication.getPublishedApplicationDetail() == null) {
            existingApplication.setPublishedApplicationDetail(null);
        }
        if (importedApplication.getPublishedAppLayout() == null) {
            existingApplication.setPublishedAppLayout(null);
        }
        if (importedApplication.getUnpublishedAppLayout() == null) {
            existingApplication.setUnpublishedAppLayout(null);
        }

        copyNestedNonNullProperties(importedApplication, existingApplication);
    }
}
