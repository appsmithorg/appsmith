package com.appsmith.external.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class GitLogDTO {
    String authorName;

    String authorEmail;

    String commitMessage;

    String timestamp;
}
