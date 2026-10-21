package com.external.plugins;

import com.external.plugins.SoapXml.SoapVersion;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.w3c.dom.Element;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SoapXmlTest {

    @Test
    void should_wrapHeaderAndBody_when_bodyIsAnOperationElement() {
        // Given
        String body = "<tns:GetItem xmlns:tns=\"http://example.com/items\"><tns:id>7</tns:id></tns:GetItem>";

        // When
        String envelope = SoapXml.envelope(SoapVersion.SOAP_12, "<auth>token</auth>", body);

        // Then
        assertThat(envelope)
                .isEqualTo("<soap:Envelope xmlns:soap=\"http://www.w3.org/2003/05/soap-envelope\">"
                        + "<soap:Header><auth>token</auth></soap:Header>"
                        + "<soap:Body>" + body + "</soap:Body></soap:Envelope>");
    }

    @Test
    void should_sendBodyAsIs_when_bodyIsAlreadyAnEnvelope() {
        // Given
        String pasted = "<?xml version=\"1.0\"?><e:Envelope xmlns:e=\"http://schemas.xmlsoap.org/soap/envelope/\">"
                + "<e:Body><Ping/></e:Body></e:Envelope>";

        // When
        String envelope = SoapXml.envelope(SoapVersion.SOAP_11, "<ignored/>", pasted);

        // Then
        assertThat(envelope).isEqualTo(pasted.substring("<?xml version=\"1.0\"?>".length()));
    }

    @Test
    void should_throw_when_bodyIsNotWellFormed() {
        // When / Then
        assertThatThrownBy(() -> SoapXml.envelope(SoapVersion.SOAP_11, null, "<GetItem><id>7</GetItem>"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("id");
    }

    @Test
    void should_convertRepeatedChildrenAttributesAndNil_when_convertingResponse() {
        // Given
        Element content = SoapXml.bodyContent(
                envelope("<ns:R xmlns:ns=\"urn:x\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">"
                        + "<ns:item id=\"7\"><ns:name>Widget</ns:name></ns:item>"
                        + "<ns:item id=\"8\"><ns:name>Gadget</ns:name></ns:item>"
                        + "<ns:note xsi:nil=\"true\"/><ns:total> 2 </ns:total></ns:R>"));

        // When
        Object value = SoapXml.toValue(content);

        // Then
        Map<String, Object> expected = new HashMap<>();
        expected.put("item", List.of(Map.of("id", "7", "name", "Widget"), Map.of("id", "8", "name", "Gadget")));
        expected.put("note", null);
        expected.put("total", " 2 ");
        assertThat(value).isEqualTo(expected);
    }

    @ParameterizedTest
    @CsvSource(
            delimiter = '|',
            value = {
                "<f:Fault xmlns:f='http://schemas.xmlsoap.org/soap/envelope/'><faultcode>f:Server</faultcode>"
                        + "<faultstring>Item not found</faultstring></f:Fault>",
                "<f:Fault xmlns:f='http://www.w3.org/2003/05/soap-envelope'><f:Code><f:Value>f:Receiver</f:Value>"
                        + "</f:Code><f:Reason><f:Text xml:lang='en'>Item not found</f:Text></f:Reason></f:Fault>"
            })
    void should_readFaultMessage_when_responseIsSoap11OrSoap12Fault(String fault) {
        // Given
        Element content = SoapXml.bodyContent(envelope(fault));

        // When / Then
        assertThat(SoapXml.isFault(content)).isTrue();
        assertThat(SoapXml.faultMessage(content)).isEqualTo("Item not found");
    }

    @Test
    void should_throw_when_responseIsNotAnEnvelope() {
        // When / Then
        assertThatThrownBy(() -> SoapXml.bodyContent("<html/>".getBytes(StandardCharsets.UTF_8)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Response is not a SOAP envelope");
    }

    private static byte[] envelope(String bodyContent) {
        return ("<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"><soap:Body>" + bodyContent
                        + "</soap:Body></soap:Envelope>")
                .getBytes(StandardCharsets.UTF_8);
    }
}
