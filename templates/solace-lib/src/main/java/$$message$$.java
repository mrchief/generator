{% include '.partials/java-package' -%}
import java.util.HashMap;

public class {{ messageName }} { 


    // Topic: This field allows the client to see the topic
    // of a received messages. It is not necessary to set this 
    // when publishing.

    private String topic;

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
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

    public void set{{- name | upperFirst }}( {{ type }} {{ name }} ) {
        this.{{-name }} = {{ name }};
        headers.put("{{ name }}", {{ name }});
    }

{% endfor %}
    // Payload
{%- set type = message.json().payload.title | upperFirst %}
{% set name = message.json().payload.title | lowerFirst %}

    private {{ type }} {{ name }};

    public {{ type }} getPayload() {
        return {{ name }};
    }

    public void setPayload({{ type }} {{ name }}) {
        this.{{- name }} = {{ name }};
    }
}
