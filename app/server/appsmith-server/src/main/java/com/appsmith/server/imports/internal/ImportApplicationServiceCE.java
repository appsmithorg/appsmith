package com.appsmith.server.imports.internal;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ImportApplicationServiceCE {

    /**
     * This function will take the Json filepart and saves the application in workspace.
     * It'll not create a new application, it'll update the existing application.
     *
     * @param workspaceId workspace to which the application needs to be hydrated
     * @param filePart    Json file which contains the entire application object
     * @return saved application in DB
     */
    Mono<ApplicationImportDTO> extractFileAndSaveApplication(String workspaceId, Part filePart, String applicationId);

    /**
     * This function will take the Json filepart and saves the application in workspace.
     * This will create a new application.
     *
     * @param workspaceId workspace to which the application needs to be hydrated
     * @param filePart    Json file which contains the entire application object
     * @return saved application in DB
     */
    Mono<ApplicationImportDTO> extractFileAndSaveApplication(String workspaceId, Part filePart);

    /**
     * Extracts the application json from the file part.
     * @param filePart
     * @return
     */
    Mono<ApplicationJson> extractApplicationJson(Part filePart);

    /**
     * This function will take the Json filepart and saves the application in workspace.
     * It'll not create a new application, it'll update the existing application by appending the pages to the application.
     * The destination application will be as it is, only the pages will be appended.
     * @param workspaceId target workspace id
     * @param applicationId target application id
     * @param branchName target branch name
     * @param applicationJson application json to be merged
     * @param pagesToImport list of page names to be imported. Null or empty list means all pages.
     * @return
     */
    Mono<Application> mergeApplicationJsonWithApplication(
            String workspaceId,
            String applicationId,
            String branchName,
            ApplicationJson applicationJson,
            List<String> pagesToImport);

    /**
     * This function will save the application to workspace from the application resource
     *
     * @param workspaceId workspace to which application is going to be stored
     * @param importedDoc application resource which contains necessary information to save the application
     * @return saved application in DB
     */
    Mono<Application> importNewApplicationInWorkspaceFromJson(String workspaceId, ApplicationJson importedDoc);

    /**
     * This function will take the application reference object to hydrate the application in mongoDB
     *
     * @param workspaceId   workspace to which application is going to be stored
     * @param importedDoc   application resource which contains necessary information to save the application
     * @param applicationId application which needs to be saved with the updated resources
     * @return Updated application
     */
    Mono<Application> importApplicationInWorkspaceFromGit(
            String workspaceId, ApplicationJson importedDoc, String applicationId, String branchName);

    /**
     * This function will replace an existing application with the provided application json. It's the top level method
     * called from snapshot service. Reason to have this method is to provide necessary permission checks.
     * @param workspaceId
     * @param importedDoc
     * @param applicationId
     * @param branchName
     * @return
     */
    Mono<Application> restoreSnapshot(
            String workspaceId, ApplicationJson importedDoc, String applicationId, String branchName);

    Mono<List<Datasource>> findDatasourceByApplicationId(String applicationId, String orgId);

    Mono<ApplicationImportDTO> getApplicationImportDTO(
            String applicationId, String workspaceId, Application application);
}
