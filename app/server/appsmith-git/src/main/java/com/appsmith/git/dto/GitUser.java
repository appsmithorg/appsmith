package com.appsmith.git.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GitUser {

    /**
     * name of the author/committer
     */
    String name;

    /**
     * email of the author/committer
     */
    String email;

    /**
     * TODO: To be converted to the Instant or a timestamp
     */
    String timestamp;
}
