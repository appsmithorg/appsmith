package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatGenerationRequestDTO {

    ChatGenerationDTO request;

    String userId;

    String instanceId;

    LicenseValidationRequestDTO licenseValidationRequest;
}
