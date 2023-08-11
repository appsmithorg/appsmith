package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateLicenseKeyDTO {
    String key;
    Boolean isDryRun;
}
