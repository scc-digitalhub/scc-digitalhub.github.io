---
layout: single
title:  "Apache NiFi - Designing a flow for a real use case"
date:   2020-04-30 15:50:00 +0200
categories: platform
author: alberto.carotti
---
This tutorial provides a step-by-step guide on how to use Apache NiFi for a simple, but realistic use case.

## Table of contents

* [Requirements](#requirements)
* [Scenario](#scenario)
* [Building the flow](#building-the-flow)
  * [Parameters and variables](#parameters-and-variables)
  * [1. Root processor: create the recipient table](#1-root-processor-create-the-recipient-table)
  * [2. Obtain data with a HTTP request](#2-obtain-data-with-a-http-request)
  * [3. Unpack the .zip file](#3-unpack-the-zip-file)
  * [4. Route flowfiles](#4-route-flowfiles)
  * [5. Map values to different ones](#5-map-values-to-different-ones)
  * [6. Specific modifications to data](#6-specific-modifications-to-data)
  * [7. Insert data into the database](#7-insert-data-into-the-database)
* [Running the flow](#running-the-flow)
* [Creating a template of the flow](#creating-a-template-of-the-flow)
* [Conclusions](#conclusions)

## Requirements

No prior experience with NiFi and its user interface is required, as every concept will be briefly introduced when necessary.
The only requirements are:
-	**An instance of Apache NiFi**. This tutorial is written with version 1.11 as basis, but is valid for most prior versions.
-	**Access to a database**. This tutorial is written using Postgres as an example, but any similar database will be fine, as only simple features will be used. No knowledge of SQL is required.

## Scenario

We want to obtain [GTFS](https://developers.google.com/transit/gtfs/) (standard format for data related to public transportation) data of the Italian city of Trento, perform minor adaptations to it, and store it into a database.

To achieve this, we will design a process with NiFi that creates the recipient table on a Postgres database, requests and downloads the file from its HTTP address, interprets and alters the data within and finally stores it into the recipient table.

GTFS data usually comes as a zipped folder, containing multiple text files with the same format but different contents (data on routes, stops, etc.). For simplicity, we will focus on the **routes.txt** file, which contains general information on the routes provided by public transportation lines.

## Building the flow

The basic building brick in NiFi is a ***processor***, a unit that performs a single operation on data (retrieval, modification, routing, storing, etc.).

We will build a chain of processors, called ***flow***, to cover our designed scenario.

NiFi saves the flow's status at every change, so you do not need to worry about saving your progress as you build the flow.

Access your NiFi instance. Drag the <img width="25" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/ui_pg.png"> icon from the top menu bar to the square-patterned area, enter a name (for example `Handle GTFS`) and click *ADD*.
<img align="right" width="280" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/t_pg.png">

A rectangle will appear in the square-patterned area: this is a ***process group***, which we will use to keep our flows neatly organized. You can think of it as equivalent to a folder on your computer’s file system.

Double click on the process group to enter it. The path on the bottom will change. This is where we will create the flow.

Before adding processors, we will create some parameters/variables.
<img align="right" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/t_path.png">

### Parameters and variables

Parameters and variables are handy to keep multiple values configured in a single place. The flow will refer to these parameters/variables, so if we decide to change a value, we only have to update the parameter/variable once and every occurrence of it will use its new value.

#### Parameters

<img align="right" width="200" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/pc_config.png">

**Parameters** were introduced in **version 1.10**, with the intent of replacing variables. Users with versions >=1.10 should use parameters, while **users of previous versions should skip to the next paragraph** to add variables.

Right-click in the square-patterned area and click *Configure*. Switch to the *GENERAL* tab, expand *Process Group Parameter Context* and click *Create new parameter context...*.

The *Add Parameter Context* prompt will appear, with the *SETTINGS* tab selected. Enter any *Name* (for example, `Public Transport`), then switch to the *PARAMETERS* tab. Click on <img width="22" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/button_plus.png"> and the *Add Parameter* prompt will show up.

<img align="right" width="260" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/pc_parameters.png">

Type `schema` for *Name* and `trento` for *Value*. *Sensitive Value* indicates whether the value should be hidden, while *Description* is purely for convenience. There is no need to change these two properties.

Click *APPLY*, then click on <img width="22" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/button_plus.png"> again and add another parameter named `routes_table` with value `lines`.

The two parameters' values will be used with Postgres, which tends to force names to lower-case. It is possible to use upper-case characters, but to keep things simple, make sure both `trento` and `lines` are lower-case.

Click **APPLY** until NiFi says "*Process group configuration successfully saved.*", then click *OK* and close the *Handle GTFS Configuration* prompt. Skip the *Variables* paragraph and we will start adding processors to the flow.

#### Variables

Right-click in the square-patterned area and click **Variables**. The *Variables* prompt will appear.

Click on <img width="22" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/button_plus.png"> and the *New Variable* prompt will appear. Insert `schema` for *Variable Name*, click *OK* and insert `trento` in the white box that appears, then click *OK*.

Click on <img width="22" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/button_plus.png"> again and add another variable, named `routes_table`, with value `lines`.

The two parameters' values will be used with Postgres, which tends to force names to lower-case. It is possible to use upper-case characters, but to keep things simple, make sure both `trento` and `lines` are lower-case.

Click *APPLY* and, once NiFi is done updating changes, click *CLOSE*. We are ready to start adding processors to the flow.

---
### 1. Root processor: create the recipient table

**Recipient tables are usually created separately, outside of NiFi**. Normally, NiFi’s role is to automatically retrieve, adapt and store data, while preparing the recipient system is a one-time ordeal handled manually or with a different tool.

We will include creation of the recipient table in the flow, to learn something more and ensure the table is compatible with this tutorial.

<img align="right" width="300" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/t_1_add.png">

Drag the <img width="25" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/ui_proc.png"> icon from the top menu bar to the square-patterned area and release it. The *Add Processor* prompt will appear. This is where the processor type is selected. Type “*executesql*” to filter the list and double click on the **ExecuteSQL** entry.

The processor will appear on the flow. This type of processor executes a query on a database.

Double click on the processor to configure it.

#### SETTINGS

<img align="right" width="300" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/t_1_settings.png">

In the ***SETTINGS*** tab, put a check mark on ***failure***, under *Automatically Terminate Relationships*, on the right side. This means that, if the operation fails, the processor should not forward the data to any of the processors we will add later. You may also change its *Name* if you'd like to.

#### SCHEDULING

In the ***SCHEDULING*** tab, insert `1 day` under *Run Schedule*. The processor will execute once every 24 hours, starting from the moment we decide to run it. Once the flow is complete and its execution finished, we will stop all processors, so we will not actually let it execute daily.

<img align="right" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/t_1_scheduling.png">

**It is important to change the default value**: root processors are responsible for providing data to the flow, and with the default value, `0 sec`, NiFi would attempt to repeat the processor's operation as much as possible. While it wouldn't cause any damage with this tutorial, **imagine if the first processor were to query a pay-per-use API: forgetting to set this value properly may cause thousands of useless queries, in just a few seconds, that give the same result but cost a lot of money**.

`0 sec` on any non-root processor simply means that the processor should execute as soon as upstream data is available, so we only need to worry about this setting for the first processor.

#### PROPERTIES

The ***PROPERTIES*** tab is the most unique, where configuration differs depending on processor type. **Bold** properties are required, while non-bold ones are optional. Most properties have a default value anyway, so we will only change a few of them.

<img align="right" width="260" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/t_1_add_cs.png">

Next to *Database Connection Pooling Service*, click on *No value set* to display a drop-down menu: drop down the selection and pick *Create new service...*. The *Add Controller Service* prompt will be displayed. We will use the default controller service, so click *CREATE*.

You will notice the property now has the value `DBCPConnectionPool`. We need to configure this controller, so click on the arrow on the right, confirming that you want to save changes along the way.

<img width="500" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/t_1_property_set.png">

***Controller services*** offer services that may be used by different processors. This one offers a connection to a database. We will later reuse this same controller service for another processor, but we only need to configure it once.

Click on <img src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/ui_gear.png">, on the far right, to open the configuration panel and switch to the *PROPERTIES* tab.

The *Database Connection URL* format depends on the database you plan on using for storing the data. In this tutorial, we will use Postgres, so the format is as follows:
```
jdbc:postgresql://<host>:<port>/<database_name>
```
For example, if the database is hosted locally, at default port *5432*, and the database is called *public_transport*:
```
jdbc:postgresql://localhost:5432/public_transport
```

<img align="right" width="400" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/t_1_config_cs.png">

For *Database Driver Class Name* enter `org.postgresql.Driver`, while for *Database Driver Location(s)* enter `https://jdbc.postgresql.org/download/postgresql-42.2.7.jar`.

Values for *Database User* and *Password* depend on how your Postgres user is configured. If you set up a fresh Postgres installation for the tutorial, user and password are both `postgres` by default. You will notice NiFi later hides the value for *Password*.

Click *APPLY* and a <img src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/ui_enable.png"> icon will appear: click it and click *ENABLE*. Close all prompts and double-click on the processor again so that we can finish configuring it.

All that's left to do is to set the query to execute. Copy and paste the following in *SQL select query* (if you're using **variables, replace `#` occurrences with `$`**), then click *OK*:
```sql
CREATE SCHEMA IF NOT EXISTS #{schema};
CREATE TABLE IF NOT EXISTS #{schema}.#{routes_table} (
  line_id varchar,
  type varchar,
  full_name varchar,
  shortened varchar
);
```

<img align="right" width="400" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/t_1_configured.png">

The command above will create a schema and a table. As mentioned before, we will focus on general information about public transportation lines. The table has 4 fields:
- `line_id` - Short identifier for public transport lines, may contain letters. For buses, it's often referred to as *bus number*.
- `type` - Bus, tram, subway, etc.
- `full_name` - The full name of the line, usually comprised of the names of starting and ending stops.
- `shortened` - A name for convenience, which contains both the line ID and a shortened version of the name.

<img align="right" width="240" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/t_1_flow.png">

Click *APPLY*. The processor is fully configured, but still displays a <img src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/icon_invalid.png"> icon: we need to direct *successful* output of this root processor to a new processor.

---
### 2. Obtain data with a HTTP request
Add a new processor, of ***InvokeHTTP*** type, by dragging <img width="22" height="22" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/ui_proc.png"> to the square-patterned area and typing "*invokehttp*" as filter.

<img align="left" width="293" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/t_2_add_rel.png">

This processor will perform a HTTP request to an address, receive a response (a *.zip* file) and forward its contents to another processor.

Now, **hover on the root** processor and a <img width="22" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/icon_rel.png"> icon will appear: drag it to the *InvokeHTTP* processor and when its border becomes green, release it.

Check **success** under *For Relationships*, on the left, and click *ADD*. When the root is successful, its data will be forwarded to *InvokeHTTP*, which will then run its task. You'll notice an arrow is pointing to *InvokeHTTP*, with a rectangle representing the ***queue*** of data between the two processors.

We won't actually use the data returned from the root processor (which only contains a success message), but connecting the processors this way ensures *InvokeHTTP* runs right after *ExecuteSQL*.

The ExecuteSQL processor's <img src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/icon_invalid.png"> icon should change to <img src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/icon_stop.png">, showing it is now valid. Let's configure *InvokeHTTP*.

#### SETTINGS

Check the boxes for these relationships: *Failure*, *No Retry*, *Original*, *Retry*. Sometimes it may be preferable to create a different flow branch for error relationships (to log the error, or try a different approach at the operation), but for simplicity, we will only create a branch for the successful (*Response*) relationship, so leave only that one unchecked.

#### SCHEDULING

Don't change anything here: *0 sec* is OK for non-root processors: it simply means it will execute immediately, as soon as the upstream processor is done.

Changing this value would only make sense if there were many ***flowfiles*** (the name of data as it travels across a NiFi flow) upstream, to avoid overloading the server we're sending HTTP requests to.

#### PROPERTIES
Since we're performing a simple *GET* request, all we need to change is the ***Remote URL*** with this value:
```
http://www.ttesercizio.it/opendata/google_transit_urbano_tte.zip
```
This address will return a *.zip* file containing [GTFS data for the Italian city of Trento](http://www.ttesercizio.it/opendata/google_transit_urbano_tte.zip). GTFS is a common standard for public transport data, so if this address is unavailable, you may look up data for a different city instead.

Configuration for this processor is complete.

---
### 3. Unpack the *.zip* file

<img align="right" width="250" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/t_3_flow.png">

We know the address returns a *.zip* file, so we need to unzip it. Add an ***UnpackContent*** processor and **connect the *InvokeHTTP* processor to this new one through the *Response* relationship**, then configure it.

#### SETTINGS

Check the boxes for *failure* and *original*.

#### PROPERTIES

Set ***Packaging Format*** to ***zip***. If you're using a different address, you may need to change it to a different value, such as ***tar***, depending on the extension you see on the address.

When you don't know the archive's type, or if you want to experiment, try placing a *IdentifyMimeType* processor in-between *InvokeHTTP* and *UnpackContent* and set ***Packaging Format*** to ***use mime.type attribute*** instead.

Don't change ***File Filter***: it's to extract only specific files from the archive, but its default value `.*` extracts them all. While it is true that we will only handle 1 GTFS file, we are doing that for simplicity's sake and normally you would extract multiple files instead.

In addition, this allows us to introduce the next processor, which is an important one.

---
### 4. Route flowfiles

Add a ***RouteOnAttribute*** processor and connect *UnpackContent* to it through the ***success*** relationship. This new processor allows you to make the flowfiles follow a different path in the flow depending on different factors, such as the values of their attributes.

Since the *UnpackContent* processor will return multiple files, you would be able to make different GTFS files undergo different transformations, by forking the flow from this processor, with a separate path for each file to process.

In this tutorial we will only set up a path for the **routes.txt** file, but additional paths are created in a similar manner.

#### SETTINGS

Check the only box available, *unmatched*. We will create a new relationship associated with the *routes.txt* file by adding a property.

#### PROPERTIES

<img align="right" width="250" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/t_4_properties.png">

Click <img width="22" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/button_plus.png"> to add a new property: its name will be `routes` and its value will be `${filename:equals('routes.txt')}`.

The `${...}` notation signals the use of [NiFi's Expression Language](https://nifi.apache.org/docs/nifi-docs/html/expression-language-guide.html), a powerful tool to reference and manipulate flowfile attributes, though in this tutorial we only need it for this particular property.

After you click *APPLY*, this will create another relationship, named *routes*, to which flowfiles will be routed when their *filename* is equal to *routes.txt*.

By adding another, equivalent property, for example for *stops.txt*, you would create an additional relationship, that you could use to direct the *stops.txt* file to a different path.

---
### 5. Map values to different ones

Add a ***LookupRecord*** processor and connect *RouteOnAttribute* to it through the ***routes*** relationship. This new processor will perform the first transformation to the data contained within *routes.txt*.

The routes.txt file contains a number of records, formatted as Comma-Separated Values (*CSV*), with the first line being the fields' names. We are interested in the following fields:
- `route_short_name` - Equivalent to the ***line_id*** column of our table
- `route_long_name` - Equivalent to **full_name**
- `route_type` - A number that identifies the type of vehicle, but we would rather use a self-explanatory word (like *tram* or *bus*) in our table. **We will modify this field by mapping the number to a word for the *type* column**.

#### SETTINGS

Put a check on *failure*.

#### PROPERTIES

Before regular properties, we need to create 3 controller services (for ***Record Reader***, ***Record Writer*** and ***Lookup Service***). Fortunately, their configuration is simple.

##### Record Reader

<img align="right" width="250" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/t_5_save.png">

Click on *No value set*, expand the drop-down list and choose *Create new service...*. From the Add Controller Prompt, drop-down the *Compatible Controller Services* drop-down list and pick ***CSVReader***, then hit *CREATE*. Click <img src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/ui_arrow.png"> to move to the configuration screen, answering *YES* to the prompt asking you to save changes.

Click <img src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/ui_gear.png"> to configure the *CSVReader* controller service. This one interprets CSV files and you could instruct it on how to interpret *routes.txt* and even change column names, but we'll let the service derive it from the header instead.

Only change these two properties: ***Schema Access Strategy*** to `Use String Fields From Header` and ***Treat First Line as Header*** (you might have to scroll down) to `true`.

Hit *APPLY* and then enable the service through the <img src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/ui_enable.png"> button.

##### Record Writer

Add a ***CSVRecordSetWriter*** controller service: no need to configure it, since all default values are fine, and we can enable it later.

##### Lookup Service

Pick ***SimpleKeyValueLookupService*** (scroll down to find it) and move to configure it. We have to create properties that will tell the processor what number should be replaced with what word.

<img align="right" width="250" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/t_5_map.png">

Add the following properties (name - value):
- `0` - `tram`
- `1` - `subway`
- `2` - `rail`
- `3` - `bus`
- `4` - `ferry`
- `5` - `other`
- `6` - `other`
- `7` - `other`
- `11` - `other`
- `12` - `other`

Click *APPLY*, enable both ***CSVRecordSetWriter*** and ***SimpleKeyValueLookupService*** and return to processor configuration.

<img align="right" width="250" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/t_5_config.png">

Set ***Result RecordPath*** to `/route_type`. This property tells the processor which field will have its values replaced with the mapped ones.

Click <img width="22" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/button_plus.png"> to add a new property, named `key` with value `/route_type`. This is the field used as a key in the look-up process.

Since we no longer need the number after mapping it to a self-explanatory word, *route_type* acts both as key and target of the mapping process. Click *APPLY*.

---
### 6. Specific modifications to data

Add a ***QueryRecord*** processor and connect *LookupRecord* to it through the ***success*** relationship. This processor allows us to run a query on a record-oriented flowfile, as if it was a table in a database.

#### SETTINGS

Check *failure* and *original*. We will define a property to create another relationship.

#### PROPERTIES

For ***Record Reader***, set the same ***CSVReader*** you created for the previous processor.

Similarly, for ***Record Writer***, set the same ***CSVRecordSetWriter***.

Add a new property, named `adapted`, and copy and paste the following query as its value:
```sql
SELECT
  route_short_name AS line_id,
  route_type AS type,
  route_long_name AS full_name,
  route_short_name || ' - ' || SUBSTRING(route_long_name, 1, 10) AS shortened
FROM FLOWFILE
```
This query changes the columns' names to match our table, discards fields we do not need, and also creates an additional field, by concatenating line identifier with a substring of the name, that matches the ***shortened*** column of our table.

Click *APPLY* and let's add the last processor.

---
### 7. Insert data into the database

Add a ***PutDatabaseRecord*** processor and connect *QueryRecord* to it through the ***adapted*** relationship. This processor takes record-oriented data, interprets it, and stores it into a database table.

#### SETTINGS

**Put a check mark on all relationships**. It's the last processor of the flow, so we do not need to forward its output anywhere, even if successful.

#### PROPERTIES

<img align="right" width="300" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/t_7_config.png">

Set ***Record Reader*** to the `CSVReader` you already created.

Set ***Statement Type*** to `INSERT`, since we will be inserting new records.

Set ***Database Connection Pooling Service*** to the `DBCPConnectionPool` you created earlier.

Set ***Schema Name*** to `#{schema}` (replace `#` with `$` if you're using variables).

Set ***Table Name*** to `#{routes_table}` replace (`#` with `$` if you're using variables).

Click *APPLY*. The flow is complete and ready to run!

<img align="right" width="200" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/t_full_flow.png">

## Running the flow

All processors should have a <img src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/icon_stop.png"> icon on them. If you find a <img src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/icon_invalid.png">, hover on it to see what's wrong.

Once you're ready, right-click in the square-patterned area outside any processor, and click ***Start*** to start all processors.

NiFi's UI reloads automatically after about 30 seconds, so force a reload by right-clicking in the square-patterned area and clicking ***Refresh***.

The icons on all processors should change from <img src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/icon_stop.png"> to <img src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/icon_run.png">

Refresh a few times, and soon you can see that, in the status bar, the two leftmost values are equal to 0, indicating respectively that no processors are processing files anymore and that there are no remaining files yet to process.

<img src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-tutorial-gtfs/images/t_status.png">

This means your flow has finished execution and is now waiting for the `1 day` interval scheduled on the root processor to pass. Right-click on the square-patterned area and click ***Stop*** to stop all processors.

If everything went well, you should now find in your database a new table, named ***lines*** in the new ***trento*** schema, containing several records, with the columns as we defined them earlier!

If any processor displays the error symbol <img width="14" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/icon_err.png"> in the corner, something went wrong. Common issues may be an incorrect configuration of **controller services**, especially *DBCPConnectionPool*, forgetting to set a **parameter/variable**, or an incorrect value for a **property**.

Hover on the error icon to see what's wrong and check the processor's corresponding section in this tutorial.

## Creating a template of the flow

NiFi automatically saves the state of your flow at every change, but you may want to create a template out of your flow, so that you may replicate it easily, revert to its current state if you make changes, preserve it even if you delete the flow, or import it to a different NiFi instance.

**Select all processors and queues in the flow**, either by holding shift and clicking them one by one, or pushing *Ctrl+A*.

<img align="right" width="250" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/menu_operate.png">

From the *Operate* menu on the left, click <img width="22" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/button_save_template.png"> and pick a name for the template. Click *CREATE* and *OK*.

Expand the <img width="25" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/button_menu.png"> menu in the top right and select *Templates*. You can see a list of templates.

If you click <img src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/button_export_template.png"> on the right, you can export your template as a XML file.

You can add templates by dragging <img width="25" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/button_add_template.png"> from the top bar to the square-patterned area.

The template will include processors, queues and controller services, allowing you to replicate the flow almost instantly. **Parameter contexts and sensitive values, such as passwords, are not saved in templates**, so you will have to set them again.

You can download the template for this tutorial's flow [here](https://github.com/alb-car/dh-posts-resources/tree/master/misc-resources/nifi-templates). You can import templates to your NiFi instance with the <img width="20" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2020-04-30-nifi-beginner-guide/images/button_upload_template.png"> button from the *Operate* menu.

## Conclusions

We learned how to build a simple flow to retrieve data from an address, route it, apply different kinds of transformations to it and store it into a database.

If you want to try and make the flow a little more complicate, you can try adding a separate branch, forking from *RouteOnAttribute*, for a different GTFS file, or you can try making branches for handling errors.

We hope this tutorial has given you the tools to start building your own NiFi flows!
