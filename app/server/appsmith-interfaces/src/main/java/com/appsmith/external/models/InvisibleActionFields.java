package com.appsmith.external.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * This class hold sensitive information related to an action,
 * and fields that have a `@JsonIgnore` on them, so that such information
 * can be serialized when an application is exported.
 */
@ToString
@Getter
@Setter
@NoArgsConstructor
public class InvisibleActionFields {

    Boolean unpublishedUserSetOnLoad;
    Boolean publishedUserSetOnLoad;

}
