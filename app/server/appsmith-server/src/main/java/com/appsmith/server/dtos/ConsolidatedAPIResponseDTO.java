package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.ConsolidatedAPIResponseCE_DTO;
import lombok.Getter;
import lombok.Setter;

/**
 * This class serves as a DTO for the response data returned via the consolidated API endpoint call
 * (v1/consolidated-api) . Each identifier in the class represents the data returned from a unique endpoint. The
 * endpoint info is mentioned on top of each identifier.
 */
@Getter
@Setter
public class ConsolidatedAPIResponseDTO extends ConsolidatedAPIResponseCE_DTO {}
