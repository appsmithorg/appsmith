package com.appsmith.server.domains;

import com.appsmith.external.models.AppsmithDomain;
import jakarta.persistence.*;
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
@Entity
public class GitConfig implements AppsmithDomain {

    String authorName;

    String authorEmail;
}
