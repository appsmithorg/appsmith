package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateLicenseKeyDTO {

    String key;

    // Flag to indicate if the license update request is for dry run and not for updating the DB.
    Boolean isDryRun;

    // Flag to indicate if the license and flags should be refreshed for the license key stored in the DB.
    Boolean refreshExistingLicenseAndFlags;
}
