package com.appsmith.server.domains;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
public class GitProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    String authorName;

    String authorEmail;

    Boolean useGlobalProfile;
}
