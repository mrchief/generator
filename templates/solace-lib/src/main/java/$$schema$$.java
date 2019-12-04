{% include '.partials/java-package' -%}
{%- set className = schemaName | upperFirst %}

public class {{ className }} { 
{% for name, prop in schema.properties() -%}
{%- set type = prop.type() | fixType %}
private {{ type }} {{ name }};
{%- endfor %}

{% for name, prop in schema.properties() -%}
{%- set type = prop.type() | fixType %}
public {{ type }} get{{- name | upperFirst }}() {
    return {{ name }};
}

public {{ className }} set{{- name | upperFirst }}( {{ type }} {{ name }} ) {
    this.{{-name }} = {{ name }};
    return this;
}

{% endfor %}
}
