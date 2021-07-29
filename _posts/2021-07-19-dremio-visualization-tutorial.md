---
layout: single
title:  "Dremio Tutorial - Visualizing Dremio Data"
date:   2021-07-19 18:00:00 +0200
categories: platform
author: erica.tomaselli
---
**NOTE:** the tutorial on creating [Virtual Datasets Based on Heterogeneous Sources](https://scc-digitalhub.github.io/platform/dremio-tutorial/) is a prerequisite to this one, as the following visualizations are based on the datasets created in part one.

Other tools can query Dremio via its ODBC, JDBC, REST and Arrow Flight interfaces as if it were a relational database and remain unaware of the underlying physical data sources. A list of clients and the instructions for connecting them to Dremio is included in the [official documentation](https://docs.dremio.com/client-applications/).

This tutorial covers how to connect to Dremio from WSO2 Data Services Server (DSS) and visualize its data on Cyclotron. Both DSS and Cyclotron are components of the Digital Hub platform. Specifically, you will create a Cyclotron dashboard that depicts the spread of the Covid-19 pandemics in Italy through several charts.

On the official Dremio website you can find more [tutorials](https://www.dremio.com/tutorials/) on how to visualize Dremio data with common tools such as Tableau, Power BI, Microsoft Excel and Apache Superset.

### Prerequisites

- A running instance of [DSS](https://github.com/scc-digitalhub/product-dss)
- A running instance of [Cyclotron](https://github.com/scc-digitalhub/cyclotron)

In order to connect DSS to Dremio, you need to place the OSGi bundle for Dremio JDBC Driver into DSS dropins folder. If you downloaded Dremio from the [Digital Hub repository](https://github.com/scc-digitalhub/dremio-oss/tree/multitenancy), you can find the bundle JAR file inside the [/bundle folder](https://github.com/scc-digitalhub/dremio-oss/tree/multitenancy/bundle). In order to use it, copy the file to <DSS_PRODUCT_HOME>/repository/components/dropins and restart DSS.

### 1. Creating a Service and a Resource on DSS

**NOTE:** DSS queries throughout the tutorial are formulated assuming Dremio datasets are found in the home space of user "dremio" ("@dremio"). If you placed them elsewhere, be sure to update the SQL queries accordingly.

Open the DSS interface and click on the **Create** button to create a new service. Name it "covid_analysis", click on **Next**, then click on **Add New Datasource**. Configure a datasource as follows:

- Datasource Id: `dremio`
- Datasource Type: `RDBMS`
- Database Engine: `Generic`
- Driver Class: `com.dremio.jdbc.Driver`
- URL: `jdbc:dremio:direct=localhost:31010` (replace "localhost" with your Dremio host name if you are not running it locally)
- User Name: `<dremio_username>`
- Password: `<dremio_password>`

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial-dremio/dss-datasource.png)

Test the connection to verify that everything is set properly, then save the new datasource and click on **Next**. Add a new query and configure it as follows:

- Query ID: `get_national_data`
- Datasource: `dremio`
- SQL: `SELECT data, ricoverati_con_sintomi, terapia_intensiva, totale_ospedalizzati, isolamento_domiciliare, totale_positivi FROM "@dremio"."dpc-covid19-ita-andamento-nazionale"`

Click on **Generate Response**, then scroll down to the section *Result (Output Mapping)* and configure the following properties:

- Output type: JSON
- Text area (the default field type is string, therefore the integer type must be specified):

```
{
 "entries": {
 "entry": [
 {
 "data": "$data",
 "ricoverati_con_sintomi": "$ricoverati_con_sintomi(type:integer)",
 "terapia_intensiva": "$terapia_intensiva(type:integer)",
 "totale_ospedalizzati": "$totale_ospedalizzati(type:integer)",
 "isolamento_domiciliare": "$isolamento_domiciliare(type:integer)",
 "totale_positivi": "$totale_positivi(type:integer)"
 }
 ]
 }
}
```

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial-dremio/dss-query.png)

Save the query, click two times on **Next** and add a new resource configured as follows:

- Resource Path: `national-data`
- Resource Method: `GET`
- Query ID: `get_national_data`

Click on **Save**, then on **Finish** and the new service will be deployed. You can now test it with `cURL` or Postman by making a GET request to `https://<your_dss_ip_and_port>/services/covid_analysis/national-data`.

The data provided by this resource is a good starting point for an analysis of the pandemics at national level, as you can build several visualizations on top of it, such as charts on the hospital situation through time or the number of hospitalized people in comparison to the whole number of infections.

### 2. Creating a Resource for the Absolute National Values

Aside from visualizing data through time on charts, the maximum registered number of infected, recovered and deceased people can be visualized as well.

On DSS, click on the "covid_analysis" service, then on **Edit Data Service (Wizard)** to open its configuration wizard. On the *Queries* page, add a new query configured as follows:

- Query ID: `get_max_national_values`
- Datasource: `dremio`
- SQL:

```
SELECT dimessi_guariti, deceduti, totale_casi
FROM "@dremio"."dpc-covid19-ita-andamento-nazionale"
WHERE data IN (SELECT MAX(data) FROM "@dremio"."covid19-ita-regioni-with-population")
```

Click on **Generate Response**, then scroll down to the section *Result (Output Mapping)* and configure the following properties:

- Output type: `JSON`
- Text area:

```
{
 "entries": {
 "entry": [
 {
 "dimessi_guariti": "$dimessi_guariti",
 "deceduti": "$deceduti",
 "totale_casi": "$totale_casi"
 }
 ]
 }
}
```

Save the query, navigate to the *Resources* page and add a new resource configured as follows:

- Resource Path: `max-national-values`
- Resource Method: `GET`
- Query ID: `get_max_national_values`

Click on **Save**, then on **Finish** and the service will be redeployed. You can now test the resource by making a GET request to `https://<your_dss_ip_and_port>/services/covid_analysis/max-national-values`.

### 3. Creating a Dynamic Resource for The Population of a Region

DSS supports the submission of dynamic queries, i.e., queries that take input parameters passed via URL. In this scenario, users that will visualize Dremio data on a Cyclotron dashboard might filter regional and provincial data by region; DSS queries will take the name of the selected region as input and use it in a WHERE clause.

Start by creating a resource that represents the population of a given region and the whole Italian population, as it would be useful to include this information in the dashboard. On DSS, click on the "covid_analysis" service, then on **Edit Data Service (Wizard)**. On the *Queries* page, add a new query configured as follows:

- Query ID: `get_region_population`
- Datasource: `dremio`
- SQL:

```
SELECT Regione, Totale FROM "@dremio"."censimento-2011-conformed" WHERE Regione=:region
UNION
SELECT 'Italia', SUM(Totale) FROM "@dremio"."censimento-2011-conformed"
```

Click on **Generate Input Mappings** and you will see the input mapping "region" added to the *Input Mappings* section. Click on the **Edit** action next to it, change the *SQL Type* to `QUERY_STRING`, save and return to the main configuration.

Click on **Generate Response**, then scroll down to the section *Result (Output Mapping)* and configure the following properties:

- Output type: `JSON`
- Text area:

```
{
 "entries": {
 "entry": [
 {
 "Regione": "$Regione",
 "Totale": "$Totale(type:integer)"
 }
 ]
 }
}
```

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial-dremio/dss-query2.png)

Save the query, navigate to the *Resources* page and add a new resource configured as follows:

- Resource Path: `region-population`
- Resource Method: `GET`
- Query ID: `get_region_population`

As you selected a query that has an input mapping, a query parameter is automatically added to the resource. Click on **Save**, then on **Finish** and the service will be redeployed. You can now test the resource by making a GET request to `https://<your_dss_ip_and_port>/services/covid_analysis/region-population?region='Abruzzo'`.

### 4. Creating a Dynamic Resource for Positive Cases per 100000 People

On DSS, click on the "covid_analysis" service, then on **Edit Data Service (Wizard)** and add a new query configured as follows:

- Query ID: `get_cases_per_100k`
- Datasource: `dremio`
- SQL:

```
SELECT data, ricoverati_con_sintomi, terapia_intensiva, totale_ospedalizzati, isolamento_domiciliare, totale_positivi FROM "@dremio"."covid19-ita-regioni-per-100k" WHERE denominazione_regione=:region
```

Click on **Generate Input Mappings** and you will see again the input mapping "region" added to the *Input Mappings* section. Change its *SQL Type* to `QUERY_STRING`, save and return to the main configuration.

Click on **Generate Response**, then scroll down to the section *Result (Output Mapping)* and configure the following properties:

- Output type: `JSON`
- Text area:

```
{
 "entries": {
 "entry": [
 {
 "data": "$data",
 "ricoverati_con_sintomi": "$ricoverati_con_sintomi(type:integer)",
 "terapia_intensiva": "$terapia_intensiva(type:integer)",
 "totale_ospedalizzati": "$totale_ospedalizzati(type:integer)",
 "isolamento_domiciliare": "$isolamento_domiciliare(type:integer)",
 "totale_positivi": "$totale_positivi(type:integer)"
 }
 ]
 }
}
```

Save the query, navigate to the *Resources* page and add a new resource configured as follows:

- Resource Path: `cases-per-100k`
- Resource Method: `GET`
- Query ID: `get_cases_per_100k`

Click on **Save**, then on **Finish** and the service will be redeployed. You can test the resource by making a GET request to `https://<your_dss_ip_and_port>/services/covid_analysis/cases-per-100k?region='Abruzzo'`.

### 5. Creating a Resource for Regional Counters

Let us suppose you want to visualize a table with the maximum number of infected, deceased and recovered people registered in every region and create a resource accordingly. Edit again the "covid_analysis" service to add the following query, which selects the most recent data for each region:

- Query ID: `get_max_values`
- Datasource: `dremio`
- SQL:

```
SELECT denominazione_regione, dimessi_guariti, deceduti, totale_casi
FROM "@dremio"."covid19-ita-regioni-with-population"
WHERE data IN (SELECT MAX(data) FROM "@dremio"."covid19-ita-regioni-with-population")
```

Click on **Generate Response**, then scroll down to the section *Result (Output Mapping)* and configure the following properties:

- Output type: `JSON`
- Text area:

```
{
 "entries": {
 "entry": [
 {
 "denominazione_regione": "$denominazione_regione",
 "dimessi_guariti": "$dimessi_guariti(type:integer)",
 "deceduti": "$deceduti(type:integer)",
 "totale_casi": "$totale_casi(type:integer)"
 }
 ]
 }
}
```

Save the query, navigate to the *Resources* page and add a new resource configured as follows:

- Resource Path: `max-regional-values`
- Resource Method: `GET`
- Query ID: `get_max_values`

Click on **Save**, then on **Finish** and the service will be redeployed. You can test the resource by making a GET request to `https://<your_dss_ip_and_port>/services/covid_analysis/max-regional-values`.

### 6. Creating a Dynamic Resource for Regional Data

The deepest level of analysis allowed by the datasets is about the total number of positive cases per province. As that is also a counter, you can create a query that selects the most recent data for each province, similarly to the one you just created, but limit the result to a given region that will be picked by the dashboard user.

Edit the "covid_analysis" service to add the following query:

- Query ID: `get_max_provincial_values`
- Datasource: `dremio`
- SQL:

```
SELECT denominazione_provincia, totale_casi
FROM "@dremio"."covid19-ita-province-reduced"
WHERE denominazione_regione=:region AND data IN (SELECT MAX(data) FROM "@dremio"."covid19-ita-province-reduced")
```

Click on **Generate Input Mappings**, change the *SQL Type* of the "region" input mapping to `QUERY_STRING`, save and return to the main configuration.

Click on **Generate Response**, then scroll down to the section *Result (Output Mapping)* and configure the following properties:

- Output type: `JSON`
- Text area:

```
{
 "entries": {
 "entry": [
 {
 "denominazione_provincia": "$denominazione_provincia",
 "totale_casi": "$totale_casi(type:integer)"
 }
 ]
 }
}
```

Save the query, navigate to the *Resources* page and add a new resource configured as follows:

- Resource Path: `max-provincial-values`
- Resource Method: `GET`
- Query ID: `get_max_provincial_values`

Click on **Save**, then on **Finish** and the service will be redeployed. You can test the resource by making a GET request to `https://<your_dss_ip_and_port>/services/covid_analysis/max-provincial-values?region='Abruzzo'`.

### 7. Creating a Resource for the List of Regions

The last resource required should provide a list of region names that will populate a drop-down menu on the dashboard. Add the following query to the "covid_analysis" service:

- Query ID: `get_region_names`
- Datasource: `dremio`
- SQL:

```
SELECT DISTINCT Regione FROM "@dremio"."censimento-2011-conformed" ORDER BY Regione
```

Note that the same query would work with any of the Covid datasets as well, just replacing column "Regione" with "denominazione_regione". Click on **Generate Response**, then scroll down to the section *Result (Output Mapping)* and configure the following properties:

- Output type: `JSON`
- Text area:

```
{
 "entries": {
 "entry": [
 {
 "name": "$Regione",
 "value": "$Regione"
 }
 ]
 }
}
```

The response is structured as a list of name-value pairs because Cyclotron expects this kind of format for drop-downs. Save the query, navigate to the *Resources* page and add a new resource configured as follows:

- Resource Path: `regions`
- Resource Method: `GET`
- Query ID: `get_region_names`

Click on **Save**, then on **Finish** and the service will be redeployed. You can test the resource by making a GET request to `https://<your_dss_ip_and_port>/services/covid_analysis/regions`.

### 8. Creating a Dashboard on Cyclotron

**NOTE:** if you are new to Cyclotron, you might consider following the [dedicated tutorial](https://scc-digitalhub.github.io/platform/cyclotron-tutorial/) for a more in-depth understanding of its functionalities, as some concepts are not repeated here. Both tutorials use the same data sources, however this one results in a more basic dashboard with limited interactivity.

Open Cyclotron user interface and create a new dashboard with the following details:

- Name: `covid19-basic-analysis-italy`
- Description: `Basic analysis of Covid-19 spreading across Italy`
- Theme: `Light`
- Show Dashboard Sidebar: `False`
- Show Dashboard Controls (click on **Additional Properties** to find it): `False`

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial-dremio/cyclotron-details.png)

Navigate to the *Pages* section, add a page and click on it. Set the following layout properties:

- Grid Columns: `5`
- Grid Rows: `8`

Click on **Add Widget**, then on *Widget 1* to configure it. Choose the type `Header`, as it will display the dashboard title. Configure it as follows:

- Title: `Covid-19 Spreading and Hospital Situation`
- Show Title: `True`
- Show Parameters: `False`
- Grid Rows: `1`
- Grid Columns: `5`

Navigate to the *Data Sources* dashboard section and add a new data source of type `JSON` with the following configuration:

- Name: `regions`
- URL: `${Cyclotron.parameters.dssUrl}/services/covid_analysis/regions`
- Post-Processor:

```
e = function(dataSet){
    dataSet.entries.entry.forEach(function(region){
        if(region.name == "Valle d'Aosta"){
            region.value = "Valle d''Aosta";
        }
    });
    return dataSet.entries.entry;
}
```

The URL contains some inline Javascript that will be replaced with the value of `dssUrl` parameter at loading time. This avoids writing (and possibly updating) the URL in every data source. The Post-Processor function takes the result returned by the "regions" API and extracts the data array. It also adds a single quote as an escape character to the region Valle d'Aosta to avoid SQL errors.

Navigate to the *Parameters* section and add two parameters. Click on the first one and configure it as follows:

- Name: `dssUrl`
- Default Value: `<your_dss_url>` (e.g. `https://192.168.31.74:9443`)
- Show in URL: `False`
- Editable in Header: `False`

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial-dremio/cyclotron-param1.png)

Now configure the second parameter, which will be visualized as a drop-down menu in the Header widget:

- Name: `region`
- Default Value: `Abruzzo` (the first region in alphabetical order)
- Editable in Header: `True`

Click on **Additional Properties**, select **Edit** and configure the following editing options:

- Display Name: `Region`
- Editor Type: `dropdown`
- Data Source: `regions`

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial-dremio/cyclotron-param2.png)

If you save the dashboard and preview it, you can see the current dashboard state with its first widget.

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial-dremio/dashboard1.png)

### 9. Visualizing National Counters

Navigate to the *Data Sources* section of the dashboard and create a new JSON data source that will provide the maximum number of infected, recovered and deceased people in Italy:

- Name: `national-counters`
- URL: `${Cyclotron.parameters.dssUrl}/services/covid_analysis/max-national-values`
- Post-Processor:

```
e = function(dataSet){
    return dataSet.entries.entry;
}
```

Navigate to the *Pages* section and add three widgets of type `Number` to the page you already created. Configure the first one as follows:

- Title: `Total Cases`
- Data Source: `national-counters`
- Grid Rows: `2`
- Grid Columns: `1`

Click on **Add Number** and set the property **Number** of *number 0* to `#{totale_casi}` (the syntax `#{}` indicates which data source field to read).

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial-dremio/dashboard2.png)

Configure the second widget similarly:

- Title: `Recovered`
- Data Source: `national-counters`
- Grid Rows: `2`
- Grid Columns: `1`
- *number 0*: `#{dimessi_guariti}`

Then the third one:

- Title: `Deceased`
- Data Source: `national-counters`
- Grid Rows: `2`
- Grid Columns: `1`
- *number 0*: `#{deceduti}`

### 10. Visualizing National Data on Charts

**NOTE:** as the "national-data" API will provide data to more than one dashboard widget, you can either create multiple JSON data sources that call the same API (thus calling the API each time) or create one preloaded JSON data source and multiple Javascript data sources that reuse its data. For the sake of less coding and keeping the dashboard basic, the tutorial follows the first approach, although the second one is more efficient.

Navigate to the *Data sources* section and create a new JSON data source configured as follows:

- Name: `national-data`
- URL: `${Cyclotron.parameters.dssUrl}/services/covid_analysis/national-data`
- Post-Processor:

```
e = function(dataSet){
    return dataSet.entries.entry.map(function(x){
        return {
            day: x.data,
            total_hospitalized: x.totale_ospedalizzati,
            total_positives: x.totale_positivi
        };
    });
}
```

The Post-Processor function sorts the fields inside each dataset row so that the first field contains the date, as this is the structure expected by Google charts.

Create also another data source for national data:

- Name: `national-data-hospitals`
- URL: `${Cyclotron.parameters.dssUrl}/services/covid_analysis/national-data`
- Post-Processor:

```
e = function(dataSet){
    return dataSet.entries.entry.map(function(x){
        return {
            day: x.data,
            home_confined: x.isolamento_domiciliare,
            hospitalized_with_symptoms: x.ricoverati_con_sintomi,
            intensive_care: x.terapia_intensiva
        };
    });
}
```

Now navigate to the *Pages* section and add two widgets of type `Google Charts` to the page you created before. Drag the first one between the "Total Cases" and the "Recovered" `Number` widgets, then the second one between the "Recovered" and the "Deceased" widgets, to improve their organization on the dashboard.

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial-dremio/dashboard3.png)

Configure the first one with the following properties:

- Title: `Evolution of National Positive Cases`
- Data Source: `national-data`
- Chart Type: `LineChart`
- Options:

```
{
    "legend": {"position": "top"},
    "hAxis": {"slantedText": false, "showTextEvery": 70},
    "vAxis": {"format": "short"},
    "chartArea": {"height": "50%", "width": "90%"}
}
```

- Grid Rows: `3`
- Grid Columns: `4`

Click on **Add Formatter** and configure *formatter 0* with a function to give timestamps a more readable format:

- Column Name: `day`
- Formatter: `function(value){return moment(value, 'YYYY-MM-DDTHH:mm:ss').format('MMM DD \'YY');}`

Then configure the second chart similarly:

- Title: `Distribution of National Positive Cases`
- Data Source: `national-data-hospitals`
- Chart Type: `ColumnChart`
- Options:

```
{
    "isStacked": true,
    "legend": {"position": "top"},
    "hAxis": {"slantedText": false, "showTextEvery": 70},
    "vAxis": {"format": "short"},
    "chartArea": {"height": "50%", "width": "90%"}
}
```

- Grid Rows: `3`
- Grid Columns: `4`

Click on **Add Formatter** and add the same formatter function you used for the previous chart.

### 11. Visualizing the Drop-down Menu for Region Selection

Navigate to the *Pages* section and add a new widget of type `Header` to the existing page. Configure the following properties:

- Show Title: `False`
- Show Parameters: `True`
- Grid Rows: `2`
- Grid Columns: `1`

Now a drop-down menu will allow to select a region for further analysis.

### 12. Visualizing the Distribution of Positive Cases in a Region

Let us create a chart that depicts the distribution of positive cases per 100000 people in the selected region. Navigate to the *Data Sources* section and create a new JSON data source with the following configuration, which resembles "national-data-hospitals" data source:

- Name: `regional-data-per-100k`
- URL: `${Cyclotron.parameters.dssUrl}/services/covid_analysis/cases-per-100k`
- Post-Processor:

```
e = function(dataSet){
    return dataSet.entries.entry.map(function(x){
        return {
            day: x.data,
            home_confined: x.isolamento_domiciliare,
            hospitalized_with_symptoms: x.ricoverati_con_sintomi,
            intensive_care: x.terapia_intensiva
        };
    });
}
```

Click on **Additional Properties**, select **Query Parameters** and add the following query parameter, that will be added to the URL with the value of the selected region before calling it (`?region=<selected_region>`):

- key: `region`
- value: `'${Cyclotron.parameters['region']}'`

Then click again on **Additional Properties**, select **Subscription To Parameters** and add the subscription to `region`. Now the data source will execute again whenever a new region is selected.

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial-dremio/dashboard4.png)

Navigate to the *Pages* section and add the following `Google Charts` widget to the page (the title contains inline Javascript to display the name of the selected region):

- Title: `${Cyclotron.parameters['region']} - Distribution of Positive Cases per 100k People`
- Data Source: `regional-data-per-100k`
- Chart Type: `ColumnChart`
- Options:

```
{
    "isStacked": true,
    "legend": {"position": "top"},
    "hAxis": {"slantedText": false, "showTextEvery": 70},
    "chartArea": {"height": "50%", "width": "90%"}
}
```

- Grid Rows: `3`
- Grid Columns: `4`

Click on **Add Formatter** and add the following formatter function:

- Column Name: `day`
- Formatter: `function(value){return moment(value, 'YYYY-MM-DDTHH:mm:ss').format('MMM DD \'YY');}`

### 13. Visualizing Regional Population Compared to National Population

In order to represent how many people live in the selected region compared to the whole Italian population, a pie chart can be included in the dashboard. Navigate to the *Data Sources* section and add a new JSON data source configured as follows:

- Name: `regional-population`
- URL: `${Cyclotron.parameters.dssUrl}/services/covid_analysis/region-population`
- Post-Processor:

```
e = function(dataSet){
    return dataSet.entries.entry;
}
```

Click on **Additional Properties**, select **Query Parameters** and add the following query parameter:

- key: `region`
- value: `'${Cyclotron.parameters['region']}'`

Then click again on **Additional Properties**, select **Subscription To Parameters** and add the subscription to `region`.

Navigate to the *Pages* section and add a new widget of type `Google Charts` to the page. Give it the following properties:

- Title: `Population`
- Data Source: `regional-population`
- Chart Type: `PieChart`
- Options:

```
{
    "legend": "none",
    "pieSliceText": "label"
}
```

- Grid Rows: `4`
- Grid Columns: `1`

### 14. Visualizing Latest Regional Data

The maximum number of infected, recovered and deceased people per region can be visualized as a table. Navigate to the *Data Sources* section and add the following JSON data source:

- Name: `latest-regional-data`
- URL: `${Cyclotron.parameters.dssUrl}/services/covid_analysis/max-regional-values`
- Post-Processor:

```
e = function(dataSet){
    return dataSet.entries.entry;
}
```

Navigate to the *Pages* section and add the following widget of type `Table`:

- Title: `Latest Data per Region`
- Data source: `latest-regional-data`
- Grid Rows: `3`
- Grid Columns: `2`

Add four columns and configure them as follows:

*column 0*:

- Name: `denominazione_regione`
- Label: `Region`

*column 1*:

- Name: `dimessi_guariti`
- Label: `Recovered`

*column 2*:

- Name: `deceduti`
- Label: `Deceased`

*column 3*:

- Name: `totale_casi`
- Label: `Total Cases`

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial-dremio/dashboard5.png)

### 15. Visualizing Provincial Data

The last widget that will compose the dashboard is another table for provincial data. Navigate to the *Data Sources* section and add the following JSON data source:

- Name: `provincial-data`
- URL: `${Cyclotron.parameters.dssUrl}/services/covid_analysis/max-provincial-values`
- Post-Processor:

```
e = function(dataSet){
    return dataSet.entries.entry;
}
```

Click on **Additional Properties**, select **Query Parameters** and add the following query parameter:

- key: `region`
- value: `'${Cyclotron.parameters['region']}'`

Then click again on **Additional Properties**, select **Subscription To Parameters** and add the subscription to `region`.

Navigate to the *Pages* section and add the final `Table` widget:

- Title: `${Cyclotron.parameters['region']} - Latest Data per Province`
- Data source: `provincial-data`
- Grid Rows: `3`
- Grid Columns: `2`

Add two columns configured as follows:

*column 0*:

- Name: `denominazione_provincia`
- Label: `Province`

*column 1*:

- Name: `totale_casi`
- Label: `Total Cases`

### 16. Final Notes

You may notice that the data displayed on column chart widgets is cropped, i.e., some data is missing on the right side of the chart. This happens because columns cannot be less than 1 pixel wide. As you are displaying a lot of data points, a solution would be to aggregate the results in the DSS queries, for example grouping the data by week or month instead of selecting single days. This would also improve charts readability.

Here is the dashboard that you should now visualize:

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial-dremio/dashboard6.png)