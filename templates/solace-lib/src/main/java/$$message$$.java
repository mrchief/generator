{% include '.partials/java-package' -%}
import java.util.HashMap;
{%- set className = messageName | upperFirst %}

public class {{ className }} { 


    // Topic: This field allows the client to see the topic
    // of a received messages. It is not necessary to set this 
    // when publishing.

    private String topic;

    public String getTopic() {
        return topic;
    }

    public {{ className }} setTopic(String topic) {
        this.topic = topic;
        return this;
    }

    // Headers with their getters and setters.
    private HashMap<String, Object> headers = new HashMap<>();
{% for name, prop in message.json().headers.properties -%}
{%- set type = prop.type | fixType %}
    private {{ type }} {{ name }};
{% endfor %}

{%- for name, prop in message.json().headers.properties -%}
{%- set type = prop.type | fixType %}
    public {{ type }} get{{- name | upperFirst }}() {
        return {{ name }};
    }

    public {{ className }} set{{- name | upperFirst }}( {{ type }} {{ name }} ) {
        this.{{-name }} = {{ name }};
        headers.put("{{ name }}", {{ name }});
        return this;
    }

{% endfor %}
    // Payload
{%- set type = message.json().payload.title | upperFirst %}
{% set name = message.json().payload.title | lowerFirst %}

    private {{ type }} {{ name }};

    public {{ type }} getPayload() {
        return {{ name }};
    }

    public {{ className }} setPayload({{ type }} {{ name }}) {
        this.{{- name }} = {{ name }};
        return this;
    }
}
