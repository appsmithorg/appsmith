package com.external.plugins;

import com.external.plugins.SoapXml.SoapVersion;
import com.external.plugins.WsdlParser.SoapOperation;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class WsdlParserTest {

    @Test
    void should_returnSoapOperationsPerPort_when_wsdlHasSoap11AndSoap12Ports() {
        // Given
        byte[] wsdl = SoapFixtures.wsdl("https://example.com/items").getBytes(StandardCharsets.UTF_8);

        // When
        Map<String, SoapOperation> operations = WsdlParser.parse(wsdl);

        // Then
        assertThat(operations)
                .containsOnlyKeys("ItemsSoap/GetItem", "ItemsSoap/ListItems", "ItemsSoap12/GetItem")
                .containsEntry(
                        "ItemsSoap/GetItem",
                        new SoapOperation(
                                "ItemsSoap",
                                "GetItem",
                                "https://example.com/items",
                                "http://example.com/items/GetItem",
                                SoapVersion.SOAP_11));
        assertThat(operations.get("ItemsSoap12/GetItem").version()).isEqualTo(SoapVersion.SOAP_12);
    }

    @Test
    void should_rejectDocument_when_wsdlDeclaresDoctype() {
        // Given
        String xxe =
                """
                <?xml version="1.0"?>
                <!DOCTYPE definitions [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
                <definitions xmlns="http://schemas.xmlsoap.org/wsdl/">&xxe;</definitions>
                """;

        // When / Then
        assertThatThrownBy(() -> WsdlParser.parse(xxe.getBytes(StandardCharsets.UTF_8)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("DOCTYPE");
    }

    @Test
    void should_rejectDocument_when_rootIsNotWsdlDefinitions() {
        // Given
        byte[] notWsdl = "<html><body>Login</body></html>".getBytes(StandardCharsets.UTF_8);

        // When / Then
        assertThatThrownBy(() -> WsdlParser.parse(notWsdl))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Not a WSDL 1.1 document");
    }
}
