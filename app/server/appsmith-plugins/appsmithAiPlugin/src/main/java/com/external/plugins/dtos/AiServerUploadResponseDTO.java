package com.external.plugins.dtos;

import lombok.Data;

import java.util.ArrayList;

@Data
public class AiServerUploadResponseDTO {
    ArrayList<String> fileIds;
}
