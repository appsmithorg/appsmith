package com.appsmith.server.dtos;

import lombok.Data;

import java.io.Serializable;

/**
 * Payload of the Cloud Services {@code POST /api/v1/pylon/email-hash} response (wrapped in {@code ResponseDTO}).
 * Only the computed hash leaves Cloud Services; the Pylon identity secret never does.
 */
@Data
public class PylonEmailHashResponseDTO implements Serializable {
    private String emailHash;
}
