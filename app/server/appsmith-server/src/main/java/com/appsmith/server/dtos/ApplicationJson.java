package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.ApplicationJsonCE;
import lombok.Getter;
import lombok.Setter;

/**
 * A DTO class to hold complete information about an application,
 * which will then be serialized to a file,
 * to export that application into a file.
 */
@Getter
@Setter
public class ApplicationJson extends ApplicationJsonCE implements ArtifactExchangeJson {}
