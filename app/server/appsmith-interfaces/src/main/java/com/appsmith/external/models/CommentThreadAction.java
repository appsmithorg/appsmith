package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.Instant;

@Getter
@Setter
public class CommentThreadAction {
    String username;
    @JsonIgnore
    @LastModifiedDate
    Instant updatedAt;
    Boolean active;
}
