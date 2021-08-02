package com.appsmith.server.dtos;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class CommentThreadFilterDTO {
    @NotNull
    private String applicationId;
    private Boolean resolved;
}
