package com.appsmith.server.dtos;

import lombok.Data;

@Data
public class PromptGenerateDTO {
    String usecase = "TEXT_GENERATE";

    String input;
}
