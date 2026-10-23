package com.external.plugins;

/** A WSDL with a SOAP 1.1 port, a SOAP 1.2 port and an HTTP port that must be ignored. */
final class SoapFixtures {

    private SoapFixtures() {}

    static String wsdl(String endpoint) {
        return """
                <?xml version="1.0" encoding="UTF-8"?>
                <definitions xmlns="http://schemas.xmlsoap.org/wsdl/"
                             xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
                             xmlns:soap12="http://schemas.xmlsoap.org/wsdl/soap12/"
                             xmlns:http="http://schemas.xmlsoap.org/wsdl/http/"
                             xmlns:tns="http://example.com/items"
                             targetNamespace="http://example.com/items" name="Items">
                  <binding name="ItemsSoap" type="tns:ItemsPortType">
                    <soap:binding transport="http://schemas.xmlsoap.org/soap/http" style="document"/>
                    <operation name="GetItem"><soap:operation soapAction="http://example.com/items/GetItem"/></operation>
                    <operation name="ListItems"><soap:operation soapAction="http://example.com/items/ListItems"/></operation>
                  </binding>
                  <binding name="ItemsSoap12" type="tns:ItemsPortType">
                    <soap12:binding transport="http://schemas.xmlsoap.org/soap/http"/>
                    <operation name="GetItem"><soap12:operation soapAction="http://example.com/items/GetItem"/></operation>
                  </binding>
                  <binding name="ItemsHttp" type="tns:ItemsPortType">
                    <http:binding verb="GET"/>
                    <operation name="GetItem"/>
                  </binding>
                  <service name="ItemsService">
                    <port name="ItemsSoap" binding="tns:ItemsSoap"><soap:address location="%1$s"/></port>
                    <port name="ItemsSoap12" binding="tns:ItemsSoap12"><soap12:address location="%1$s"/></port>
                    <port name="ItemsHttp" binding="tns:ItemsHttp"><http:address location="%1$s"/></port>
                  </service>
                </definitions>
                """
                .formatted(endpoint);
    }
}
