package com.appsmith.server.dtos;

import com.appsmith.server.domains.CommentMode;
import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class CommentThreadFilterDTO {
    @NotNull
    private String applicationId;
    private Boolean resolved;
    private CommentMode mode;
}
