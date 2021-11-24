---
layout: single
title:  "Dremio Tutorial - Connecting to Apache Drill"
date:   2021-11-18 11:30:00 +0200
categories: platform
author: erica.tomaselli
---
This post illustrates how to use [Apache Drill](http://drill.apache.org/), a distributed query engine for large-scale data processing, as a Dremio data source, thus taking advantage of both instruments.

In order to connect to Drill via JDBC, Dremio requires:

- Drill JDBC driver
- an ARP-based connector

The following paragraphs explain how to get them and what are the configurations required to query data sources connected to Drill from Dremio.

### Prerequisites

- a running instance of Dremio
- Apache Maven 3.6.3 or later

### Drill JDBC Driver

Although the official [JDBC driver](https://drill.apache.org/docs/using-the-jdbc-driver/) can be downloaded from Drill website, it cannot be used as is with Dremio due to some conflicting dependencies and inconsistency between Drill's support for catalogs and their use inside queries.

To overcome these problems, the DigitalHub provides [its own adaptation](https://github.com/scc-digitalhub/drill/tree/scc-features) of the driver that can be built with Maven and used with Dremio.

Execute the following command line instructions to clone the repository, switch to "scc-features" branch and build it (this is a fork of Drill repository, therefore you are actually building the whole Drill code):

```
git clone https://github.com/scc-digitalhub/drill.git drill_source
cd drill_source
git checkout scc-features
mvn clean install -DskipTests
```

The JDBC driver JAR file location will be *drill_source/exec/jdbc-all/target/drill-jdbc-all-1.18.0.jar*.

If you do not have Drill running in distributed mode (with ZooKeeper) and would like to run it in embedded mode (locally) on the machine where Dremio is installed, you can simply extract the archive *drill_source/distribution/target/apache-drill-1.18.0.tar.gz* in a new folder and launch the script *apache-drill-1.18.0/bin/drill-embedded* from the command line.

**NOTE**: as both Dremio and Drill listen to JDBC connections on port 31010 by default, chances are you need to change it for Drill. You can do that by opening the file *apache-drill-1.18.0/conf/drill-override.conf* and adding the property `drill.exec.rpc.user.server.port: 31013` (or another available port number), then (re)start Drill.

If you do already have Drill deployed and would like to connect to that, verify that its version and the JDBC driver version (currently 1.18.0) match.

To check that Drill is running, you can open its web interface inside a browser (locally the URL will be "http://localhost:8047" by default).

![alt text](https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2021-11-18-dremio-connection-to-drill/images/drill-interface.png)

### ARP-based Connector

The DigitalHub also provides a [connector](https://github.com/scc-digitalhub/dremio-drill-connector) for Drill based on the Dremio Advanced Relational Pushdown (ARP) framework, that is, a standardized plugin which defines the connection options and the mapping between Dremio and Drill syntaxes.

Clone the repository and build the connector (note that the `version.dremio` property specified in the *pom.xml* file must match your Dremio version):

```
git clone https://github.com/scc-digitalhub/dremio-drill-connector.git
cd dremio-drill-connector
mvn clean install
```

The connector JAR file location will be *dremio-drill-connector/target/dremio-drill-plugin-\<version\>.jar* (e.g. "dremio-drill-plugin-15.7.0-202106112202490252-2fb62d31.jar").

### Dremio Configuration

After building both the driver and the connector, they must be placed inside Dremio directory:

- copy *drill-jdbc-all-1.18.0.jar* file into *\<dremio_home\>/jars/3rdparty*
- copy *dremio-drill-plugin-<version>.jar* file into *\<dremio_home\>/jars*

Finally restart Dremio. Now if you navigate to its web UI and try to add a new external source, you will see Drill listed as a data source type.

![alt text](https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2021-11-18-dremio-connection-to-drill/images/dremio-datasources.png)

### Creating a Drill Data Source on Dremio

On Dremio UI, click on the *Add External Source* button and select `Drill` from the list. You should now provide the information required to connect to your Drill instance (the format of the connection URL is documented more in depth [here](https://drill.apache.org/docs/using-the-jdbc-driver/#using-the-jdbc-url-for-a-random-drillbit-connection)):

- Name: the name for your new data source (e.g. `mydrill`)
- Direct Connection: check this property to connect to Drill directly (without ZooKeeper); leave it unchecked to use ZooKeeper
- Host: one Drill (when connecting directly) or ZooKeeper host name or IP address (while Drill connection URL can include multiple `<host>:<port>` pairs, this is not currently supported by the Dremio connector)
- Port: one port number (corresponds to the aforementioned `drill.exec.rpc.user.server.port` property when connecting directly; defaults to 2181 when connecting to ZooKeeper)
- Directory: Drill directory in ZooKeeper (ignored when connecting directly)
- Cluster ID: the cluster ID configured in *drill-override.conf* (ignored when connecting directly)

The following example shows the fields populated with the information required to directly connect to a local Drill instance (as Dremio and Drill are both running locally, Drill is using port 31013):

![alt text](https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2021-11-18-dremio-connection-to-drill/images/new-source.png)

If you click on the *Save* button and the information provided is correct, the source will be successfully created and you will be redirected to its root folder, where all Drill schemas are listed as subfolders:

![alt text](https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2021-11-18-dremio-connection-to-drill/images/drill-schemas.png)

### Querying Drill Schemas

Let us suppose Drill has a schema named "testpostgres" that connects to a PostgreSQL database. Now that Dremio is connected to Drill, its tables are accessible as Dremio datasets:

![alt text](https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2021-11-18-dremio-connection-to-drill/images/drill-postgres.png)

The same query can thus be executed on both instruments (note that Dremio queries must follow Dremio syntax rules, therefore the escape character is `"` instead of `` ` ``). For example, the following Drill query:

```
SELECT Cities.name, Pos.city_id, Pos.guest_id
FROM testpostgres.cities Cities
JOIN testpostgres.guest_position Pos ON Cities.city_id=Pos.city_id
```

![alt text](https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2021-11-18-dremio-connection-to-drill/images/drill-result.png)

would be equivalent to and produce the same result as the following Dremio query:

```
SELECT Cities.name, Pos.city_id, Pos.guest_id
FROM mydrill.testpostgres.cities Cities
JOIN mydrill.testpostgres.guest_position Pos ON Cities.city_id=Pos.city_id
```

![alt text](https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2021-11-18-dremio-connection-to-drill/images/dremio-result.png)
