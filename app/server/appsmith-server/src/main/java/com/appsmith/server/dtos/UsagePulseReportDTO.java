package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UsagePulseReportDTO {
    List<UsagePulseExportDTO> usageData;
    // Random generated ID to verify the validity of the requests data at receivers end i.e. cloud service
    String message;
    // HMAC hash of the above message
    String hashedMessage;
    String instanceId;
}