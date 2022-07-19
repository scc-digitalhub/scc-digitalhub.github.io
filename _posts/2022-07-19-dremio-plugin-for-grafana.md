---
layout: single
title:  "Dremio Data Source Plugin for Grafana"
date:   2022-07-19 11:30:00 +0200
categories: platform
author: erica.tomaselli
---
A plugin for Grafana to use Dremio as a data source has been developed within the Digital Hub. Instructions on how to install it and configure it are illustrated in this post.

### Prerequisites

- a running instance of Dremio
- a running instance of Grafana

### Building the Plugin

The [plugin](https://github.com/scc-digitalhub/grafana-dremio-datasource-plugin) is based on the [data source plugin template](https://grafana.com/tutorials/build-a-data-source-plugin/) created with [grafana-toolkit](https://github.com/grafana/grafana/tree/main/packages/grafana-toolkit). It is just frontend and interacts with Dremio REST API. Its requests are proxied through the Grafana server.

**NOTE**: in order to use the plugin out of the box, you might need to configure your Grafana to accept [unsigned](https://grafana.com/docs/grafana/latest/plugins/plugin-signatures/) plugins.

First of all, clone the plugin repository inside your Grafana [plugin directory](https://grafana.com/docs/grafana/latest/administration/configuration/#plugins):

```
git clone https://github.com/scc-digitalhub/grafana-dremio-datasource-plugin.git
```

Then install its dependencies with Yarn and build the plugin:

```
cd grafana-dremio-datasource-plugin
yarn install
yarn build
```

Finally restart Grafana.

### Creating a Dremio Data Source on Grafana

On Grafana UI, on *Configuration -> Plugins* section you should see a plugin named "Dremio" marked as "unsigned" in the list.

Navigate to *Configuration -> Data Sources* and add a new Dremio data source. You will be asked to provide the following configuration data:

- Dremio URL (e.g., `http://localhost:9047`)
- Your Dremio username
- Your Dremio password

Click on *Save & Test* to ensure the connection is successfull. You can now query your Dremio datasets from Grafana.