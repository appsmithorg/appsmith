package com.external.plugins.dtos;

import lombok.Data;

import java.util.ArrayList;

@Data
public class AiServerUploadDTO {
    ArrayList<String> files;
    String id;
}
