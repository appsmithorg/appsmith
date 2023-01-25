package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UsagePulseReportDTO {
    List<UsagePulseExportDTO> usageData;
    String instanceId;
    String hashedInstanceId;
}