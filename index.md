---
layout: splash
author_profile: false
header:
  overlay_color: "#000"
  overlay_filter: "0.5"
  overlay_image: /assets/images/grid.jpg
excerpt: "An Open Source Platform for Digital Transformation, Open Data and Open Service Management"
feature_row:
  - image_path: assets/images/gears.jpg
    title: "Modular Architecture"
    excerpt: "Extensbile Cloud-native platform based on Open Source components"
    url: "https://scc-digitalhub.github.io/digitalhub/architecture"
    btn_label: "Read More"
    btn_class: "btn--primary"
  - image_path: /assets/images/data.jpg
    title: "Data Services"
    excerpt: "Extensbile platform for data management, exposure, and Data Mesh scenarios"
    url: "https://scc-digitalhub.github.io/digitalhub/architecture/#data-engineering"
    btn_label: "Read More"
    btn_class: "btn--primary"
  - image_path: /assets/images/service.jpg
    title: "Machine Learining and AI"
    excerpt: "Embracing the complete lifecycle of ML models, from data preparation and training to experiments tracking and model serving."
    url: "https://scc-digitalhub.github.io/digitalhub/architecture/#ml-engineering"
    btn_label: "Read More"
    btn_class: "btn--primary"
---

{% include feature_row id="intro" type="center" %}

{% include feature_row %}

<h3 class="archive__subtitle">{{ site.data.ui-text[site.locale].recent_posts | default: "Recent Posts" }}</h3>

{% if paginator %}
  {% assign posts = paginator.posts %}
{% else %}
  {% assign posts = site.posts %}
{% endif %}

{% for post in posts %}
  {% include archive-single.html %}
{% endfor %}

{% include paginator.html %}