package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.ApplicationCE;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
@FieldNameConstants
public class Application extends ApplicationCE implements Artifact {

    // This constructor is used during clone application. It only deeply copies selected fields. The rest are either
    // initialized newly or is left up to the calling function to set.
    public Application(Application application) {
        super(application);
    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    @NoArgsConstructor
    public static class AppLayout extends AppLayoutCE implements Serializable {
        public AppLayout(AppLayout.Type type) {
            super(type);
        }
    }

    /**
     * EmbedSetting is used for embedding Appsmith apps on other platforms
     */
    @Data
    @EqualsAndHashCode(callSuper = true)
    public static class EmbedSetting extends EmbedSettingCE {}

    /**
     * NavigationSetting stores the navigation configuration for the app
     */
    @Data
    @EqualsAndHashCode(callSuper = true)
    public static class NavigationSetting extends NavigationSettingCE {}

    /**
     * AppPositioning captures widget positioning Mode of the application
     */
    @Data
    @EqualsAndHashCode(callSuper = true)
    @NoArgsConstructor
    public static class AppPositioning extends AppPositioningCE {
        public AppPositioning(String type) {
            super(type);
        }

        public AppPositioning(AppPositioning.Type type) {
            super(type);
        }
    }

    @Data
    @EqualsAndHashCode(callSuper = true)
    @NoArgsConstructor
    public static class ThemeSetting extends ThemeSettingCE {
        public ThemeSetting(Type colorMode) {
            super(colorMode);
        }
    }

    public static class Fields extends ApplicationCE.Fields {}
}
