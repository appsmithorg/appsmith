package com.appsmith.server.dtos;

import lombok.Data;
import org.springframework.http.HttpHeaders;


@Data
public class ExportFileDTO {
    HttpHeaders httpHeaders;
    Object applicationResource;
}
