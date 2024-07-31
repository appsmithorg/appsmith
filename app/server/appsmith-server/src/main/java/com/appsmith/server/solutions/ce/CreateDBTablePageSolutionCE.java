package com.appsmith.server.solutions.ce;

import com.appsmith.server.dtos.CRUDPageResourceDTO;
import com.appsmith.server.dtos.CRUDPageResponseDTO;
import reactor.core.publisher.Mono;

public interface CreateDBTablePageSolutionCE {

    /**
     * This function will clone template page along with the actions. DatasourceStructure is used to map the
     * templateColumns with the datasource under consideration
     *
     * @param branchedPageId  for which the template page needs to be replicated
     * @param pageResourceDTO
     * @param environmentId
     * @return generated pageDTO from the template resource
     */
    Mono<CRUDPageResponseDTO> createPageFromDBTable(
            String branchedPageId, CRUDPageResourceDTO pageResourceDTO, String environmentId);

    // TODO Remove this interface, once the client handles environmentId changes
    Mono<CRUDPageResponseDTO> createPageFromDBTable(
            String basePageId,
            CRUDPageResourceDTO pageResourceDTO,
            String environmentId,
            String branchName,
            Boolean isTrueEnvironmentRequired);
}
