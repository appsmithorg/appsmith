package com.external.plugins;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Property;
import com.external.constants.FieldName;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;

public class GoogleSheetsPluginTest {

    @Test
    public void DsConfigPropertiesWithNoEmailTest() {
        DatasourceConfiguration dsconfig = new DatasourceConfiguration();
        AuthenticationDTO authentication = new AuthenticationDTO();
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();
        authenticationResponse.setToken("mockToken");
        authentication.setAuthenticationResponse(authenticationResponse);
        dsconfig.setAuthentication(authentication);

        GoogleSheetsPlugin.GoogleSheetsPluginExecutor pluginExecutor = new GoogleSheetsPlugin.GoogleSheetsPluginExecutor();
        GoogleSheetsPlugin.GoogleSheetsPluginExecutor spyPluginExecutor = spy(pluginExecutor);

        doReturn(Mono.just("randomEmailAddress")).when(spyPluginExecutor).fetchEmailAddressFromGoogleAPI(any());
        Mono<DatasourceConfiguration> returnedDsConfigMono = spyPluginExecutor.getDatasourceMetadata(dsconfig);

        StepVerifier.create(returnedDsConfigMono)
                .assertNext(dsconfig1 -> {
                    assert (dsconfig1.getProperties() != null);
                    assert(dsconfig1.getProperties().size() == 1);
                    assert (dsconfig1.getProperties().get(0).getValue().equals("randomEmailAddress"));
                    assert (dsconfig.getProperties().get(0).getValue().equals("randomEmailAddress"));
                });
    }

    @Test
    public void DsConfigPropertiesWithEmailAndOtherDataTest() {
        DatasourceConfiguration dsconfig = new DatasourceConfiguration();
        dsconfig.setProperties(List.of(new Property("otherKey", "otherValue"),
                                       new Property(FieldName.EMAIL_ADDRESS, "oldEmailAddress")));
        AuthenticationDTO authentication = new AuthenticationDTO();
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();
        authenticationResponse.setToken("mockToken");
        authentication.setAuthenticationResponse(authenticationResponse);
        dsconfig.setAuthentication(authentication);

        GoogleSheetsPlugin.GoogleSheetsPluginExecutor pluginExecutor = new GoogleSheetsPlugin.GoogleSheetsPluginExecutor();
        GoogleSheetsPlugin.GoogleSheetsPluginExecutor spyPluginExecutor = spy(pluginExecutor);

        doReturn(Mono.just("randomEmailAddress")).when(spyPluginExecutor).fetchEmailAddressFromGoogleAPI(any());
        Mono<DatasourceConfiguration> returnedDsConfigMono = spyPluginExecutor.getDatasourceMetadata(dsconfig);

        StepVerifier.create(returnedDsConfigMono)
                .assertNext(dsconfig1 -> {
                    assert (dsconfig1.getProperties() != null);
                    assert(dsconfig1.getProperties().size() == 1);
                    assert (dsconfig1.getProperties().get(1).getKey().equals(FieldName.EMAIL_ADDRESS));
                    assert (dsconfig1.getProperties().get(1).getValue().equals("randomEmailAddress"));
                    assert (dsconfig.getProperties().get(1).getValue().equals("randomEmailAddress"));
                });
    }
}
