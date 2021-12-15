package com.appsmith.server.solutions.ce;

import com.appsmith.server.constants.SerialiseApplicationObjective;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationJson;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Mono;


public interface ImportExportApplicationServiceCE {

    /**
     * This function will give the application resource to rebuild the application in import application flow
     *
     * @param applicationId which needs to be exported
     * @return application reference from which entire application can be rehydrated
     */
    Mono<ApplicationJson> exportApplicationById(String applicationId, SerialiseApplicationObjective serialiseFor);

    Mono<ApplicationJson> exportApplicationById(String applicationId, String branchName);

    /**
     * This function will take the Json filepart and saves the application in organization
     *
     * @param orgId    organization to which the application needs to be hydrated
     * @param filePart Json file which contains the entire application object
     * @return saved application in DB
     */
    Mono<Application> extractFileAndSaveApplication(String orgId, Part filePart);

    /**
     * This function will save the application to organisation from the application resource
     *
     * @param organizationId organization to which application is going to be stored
     * @param importedDoc    application resource which contains necessary information to save the application
     * @return saved application in DB
     */
    Mono<Application> importApplicationInOrganization(String organizationId, ApplicationJson importedDoc);

    /**
     * This function will take the application reference object to hydrate the application in mongoDB
     *
     * @param organizationId organization to which application is going to be stored
     * @param importedDoc    application resource which contains necessary information to save the application
     * @param applicationId  application which needs to be saved with the updated resources
     * @return Updated application
     */
    Mono<Application> importApplicationInOrganization(String organizationId,
                                                      ApplicationJson importedDoc,
                                                      String applicationId,
                                                      String branchName);

}
