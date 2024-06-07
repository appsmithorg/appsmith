package com.appsmith.server.domains;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class GitProfile {

    String authorName;

    String authorEmail;

    Boolean useGlobalProfile;
}
