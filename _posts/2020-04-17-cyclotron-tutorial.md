---
layout: single
title:  "Cyclotron Tutorial"
date:   2020-04-16 17:31:34 +0200
categories: platform
author: erica.tomaselli
---
This tutorial illustrates how to create on Cyclotron a dashboard with the following features:
- JSON datasources
- OData datasources
- processing and/or combining different datasources with JavaScript
- geospatial data on an interactive map
- encryption of sensitive data within the configuration.

The main dataset used represents the spread of Covid-19 desease across Italy and is made available by the Civil Protection Department on the following repository: https://github.com/pcm-dpc/COVID-19. The other sources used are:

- administrative borders of the Italian regions, provided by https://gist.github.com/datajournalism-it
- population of each region according to the 2011 census conducted by ISTAT, exposed on the open data portal DatiOpen.it, http://www.datiopen.it/it/opendata/Censimento_2011_Popolazione_per_regione_e_sesso

### 1. Creating a New Dashboard

On Cyclotron user interface, create a new dashboard named `covid19-analysis-italy`. General dashboard properties, such as the theme or the sidebar, can be configured in the *Details* section of the editor. As each dashboard is saved as a JSON document, such document can be viewed and modified directly by clicking on the *Edit JSON* button.

Here is an example of the initial dashboard configuration:

```
{
    "description": "Analysis of Covid-19 spreading across Italy",
    "name": "covid19-analysis-italy",
    "pages": [],
    "showDashboardControls": false,
    "sidebar": {
        "showDashboardSidebar": false
    },
    "theme": "light"
}
```

This dashboard will include two pages: the first one will display the map of Italy and some general daily data, either at national level or filtered by region via a selection on the map; the second one will allow for a deeper analysis. On both pages, selecting which day to analyse will be possible via a time slider.

### 2. Header

In the *Pages* section of the editor, create two pages with the *Add Page* button and click on the first one. The main properties of a page are the number of rows and the number of columns in which it will be partitioned in order to create a grid where to place the widgets.

Assign the following properties to the first page:

- Name: `general-analysis`
- Grid Columns: `4`
- Grid Rows: `5`

In order to give the dashboard a header and some buttons to navigate between the pages, click on the *Add Widget* button to create a new widget on this page, assign it the type `Header` and the following properties:

- Title: `Covid-19 Spreading across Italy`
- Show Title: `true`
- Show Parameters: `false`
- Grid Rows: `1`
- Grid Columns: `4`

Adding the navigation buttons requires creating an HTML script in the text area of the property *HTML Content*; the script will be compiled and the result will be displayed below the widget title. Cyclotron includes by default Bootstrap 3, which can be used to style HTML elements without importing the library.

```
<div class="button-group" align="center">
    <button class="btn btn-default" id="gen">General Analysis</button>
    <button class="btn btn-default" id="det">Details</button>
</div>
<script>
    // Built-in function goToPage(pageNum) is used to navigate to the specified page
    $('#gen').on('click', function () {
        Cyclotron.goToPage(1);
    });
    $('#det').on('click', function () {
        Cyclotron.goToPage(2);
    });
</script>
```

After saving and clicking on the *Preview* button, you can visualize the dashboard with the newly created widget.

### 3. Time Slider

Create another widget in the same page, assign it the type `Slider` and configure it as follows to set the time interval and the pip scale that will appear next to the slider:

- Minimum date-time: `2020-02-24`
- Maximum date-time: `#{dateOfToday}`
- Date-time Format: `YYYY-MM-DD`
- Step: `1`
- Pips.Mode: `count`
- Pips.Values: `5`
- Pips.Stepped: `true`
- Grid Rows: `4`
- Grid Columns: `1`
- Orientation: `vertical`
- Direction: `rtl` (right-to-left or bottom-to-top)
- Tooltips: `true`
- Initial Handle Position: `#{selectedDate}`

The string `#{dateOfToday}` is a placeholder; it indicates that the property *Maximum date-time* must be assigned the value held by the parameter **dateOfToday**, which you are about to create. The same applies to the property *Initial Handle Position* and the parameter **selectedDate**. Find the property *Subscription To Parameters*, click on *Add Subscription to Parameters* and enter the value `dateOfToday`. When the widget will be loaded and whenever this parameter will be updated, the placeholder will be replaced with the current value of **dateOfToday**. Subscription to **selectedDate** is not necessary, as *Initial Handle Position* is used only at widget loading.

In the *Parameters* section of the dashboard editor, click on *Add Parameter* and assign the newly created parameter the following properties:

- Name: `dateOfToday`
- Default Value: `${moment().format('YYYY-MM-DD')}`
- Show in URL: `false`

Its default value will be today's date, in the same format used by the slider.

Create another parameter with the following properties:

- Name: `selectedDate`
- Default Value: `${moment().format('YYYY-MM-DD')}`
- Show in URL: `false`

**selectedDate** will hold the date selected via the slider and will be used by the other dashboard components to filter the data. Its initial value will be today's date, but it will update whenever a new date is selected.

Create yet another parameter, which will hold the region selected on the map:

- Name: `selectedRegion`
- Show in URL: `false`

Finally go back to the slider configuration, find the property *Specific Events*, click on *Add param-event* and fill the following fields:

- Parameter Name: `selectedDate`
- Event: `dateTimeChange`

Now on every "date change" event the parameter will be assigned the new value. You can click on *Preview* to visualize the dashboard state.

The complete JSON document of the slider widget should match the following:

```
{
    "direction": "rtl",
    "gridHeight": 4,
    "gridWidth": 1,
    "handlePosition": "#{selectedDate}",
    "maxValue": "#{dateOfToday}",
    "minValue": "2020-02-24",
    "momentFormat": "YYYY-MM-DD",
    "orientation": "vertical",
    "parameterSubscription": ["dateOfToday"],
    "pips": {
        "mode": "count",
        "stepped": true,
        "values": "5"
    },
    "player": {},
    "specificEvents": [{
        "event": "dateTimeChange",
        "paramName": "selectedDate"
    }],
    "step": 1,
    "tooltips": true,
    "widget": "slider"
}
```

### 4. Counters

The JSON file https://github.com/pcm-dpc/COVID-19/blob/master/dati-json/dpc-covid19-ita-andamento-nazionale.json contains data about the number of cases, hospitalizations, deaths, tests registered day by day at national level, while the file https://github.com/pcm-dpc/COVID-19/blob/master/dati-json/dpc-covid19-ita-regioni.json contains analogous data at regional level. Such data can be analysed on the dashboard by configuring some datasources that will retrieve and prepare them for their visualization in some widgets.

In the *Data Sources* section of the editor, click on *Add Data Source* to create a new datasource of type `JSON`, which can retrieve data from both a web service and a .json file. Assign it the following properties to get national data:

- Name: `national-data`
- URL: `https://github.com/pcm-dpc/COVID-19/raw/master/dati-json/dpc-covid19-ita-andamento-nazionale.json`
- Preload: `true`
- Deferred: `true`

Create a second datasource of type `JSON` to get regional data:

- Name: `regional-data`
- URL: `https://github.com/pcm-dpc/COVID-19/raw/master/dati-json/dpc-covid19-ita-regioni.json`
- Preload: `true`
- Deferred: `true`

Lastly create a third one of type `JavaScript` with the following properties:

- Name: `general-counters`
- Subscription To Parameters: `selectedDate`, `selectedRegion`
- Processor:

```
e = function(promise){
    var result = [];
    var day = Cyclotron.parameters.selectedDate;
    var region = Cyclotron.parameters.selectedRegion;
    var datasource = (region && region.Regione ? 'regional-data' : 'national-data');
    
    Cyclotron.dataSources[datasource].execute().then(function(dataset){
        var dayData = _.find(dataset['0'].data, function(d){
            if(region && region.Regione){
                return moment(d.data, 'YYYY-MM-DDTHH:mm:ss').isSame(moment(day, 'YYYY-MM-DD'), 'day') && d.denominazione_regione.includes(region.Regione);
            } else {
                return moment(d.data, 'YYYY-MM-DDTHH:mm:ss').isSame(moment(day, 'YYYY-MM-DD'), 'day');
            }
        });
        
        if(dayData){
            result.push(dayData);
        }
        
        promise.resolve(result);
    });
}
```

The datasource will refresh every time the parameters **selectedDate** or **selectedRegion** take a new value, which will be used to filter only the subset of data that match the selected date and/or region. The property *Processor* is a JavaScript function that checks which filters to apply, processes the data and returns them synchronously. Depending on whether a region has been selected or not, the function executes the datasource for either national or regional data (which in both cases is an array of days), finds the subset of data matching the filters and prepares the data for the widget that will receive them.

Now that data retrieval has been set up, go back to the page `general-analysis` and create four new widgets of type `Number`, each one with the following properties (you can copy the JSON document of the first one and paste it into the JSON editor of the other ones):

- Data Source: `general-counters`
- Grid Rows: `1`
- Grid Columns: `1`
- No Data Message: `Data not available for the selected date and/or region`

The four widgets will use the same datasource, but each one will expose one information. The property *Numbers* can be used to display a series of values, either static or provided by the datasource (by means of the syntax `#{field_name}`). For the first `Number` widget, click on *Add Number* inside the property *Numbers* and create a number with the following properties:

- Number: `#{totale_casi}`
- Prefix: `Total Cases`

Do the same for the second widget:

- Number: `#{totale_positivi}`
- Prefix: `Total Positive`

The third one:

- Number: `#{dimessi_guariti}`
- Prefix: `Recovered`

And the fourth one:

- Number: `#{deceduti}`
- Prefix: `Deaths`

If you now click again on *Preview* and use the slider to change the date, you will find that the four counters update with either data related to the selected day, if any, or the provided *No Data Message*. When the map is configured, the counters will also update in response to the selection of a region.

At the moment the widgets are placed on the page from left to right, in the order in which they are listed. In the next step, the last widget will be added to the page and the counters will align vertically to fill the space on the grid.

### 5. Georaphical Data and Interactive Map

The map you are going to create will have the following components:

- OSM layer: basic geographic map
- vector layer with regional borders: each region will be represented as a GeoJSON feature and clicking on it will allow the user to analyse the data related to that region on the second page of the dashboard

Go back to the page `general-analysis`, click on *Add Widget* and then drag the newly created widget between the `Slider` widget and the first `Number` widget, so that it becomes third in the widget list of this page. Give it the following properties:

- Widget Type: `OpenLayers Map`
- Center.X: `13`
- Center.Y: `42`
- Zoom: `5`
- Grid Rows: `4`
- Grid Columns: `2`
- Controls: `Zoom`

Under the *Layers* property, add two layers by clicking on *Add Layer*. Configure the first one as follows to have a base map in neutral colors:

- Type: `tile`
- Source.Name: `Stamen`
- Source.Configuration:

```
{
    "layer": "toner-lite"
}
```

Configure also the second layer:

- Type: `vector`
- Source.Name: `Vector`
- Source.Configuration:

```
{
    "format": new ol.format.GeoJSON(),
    "url": "https://gist.githubusercontent.com/datajournalism-it/f1abb68e718b54f6a0fe/raw/23636ff76534439b52b87a67e766b11fa7373aa9/regioni-con-trento-bolzano.geojson"
}
```

At this point, if you save and reopen the dashboard preview, the regional borders will already be visible on the map but not yet clickable. In order to add interactivity, open the vector layer configuration and give the *Style* property the following value, i.e., a function that will style the features on the map:

```
e = function(feature) {
    var styles = {
        'desel': new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#3399CC',
                width: 2
            }),
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.3)'
            })
        }),
        'sel': new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#3399CC',
                width: 2
            }),
            fill: new ol.style.Fill({
                color: 'rgba(51, 153, 204, 0.5)'
            })
        })
    };
    
    if(Cyclotron.parameters.selectedRegion && Cyclotron.parameters.selectedRegion.Regione == feature.getProperties().Regione){
        return styles.sel;
    } else {
        return styles.desel;
    }
}
```

Find the widget property *Specific Events*, click on *Add param-event* and configure the event as follows:

- Parameter Name: `selectedRegion`
- Event: `selectVectorFeature`

Finally, in the *Scripts* section of the dashboard editor, create a new script with the following properties:

- Single-Load: `true`
- JavaScript Text: 

```
Cyclotron.featureSelectStyleFunction = function(feature){
    return new ol.style.Style({
        stroke: new ol.style.Stroke({color: '#3399CC', width: 2}),
        fill: new ol.style.Fill({color: 'rgba(51, 153, 204, 0.5)'})
    });
}
```

This function will be used to style selected features only.

Now the first page of the dashboard is complete. Below are some screenshots of the result, with and without a selected region:

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial/pagina-analisi-generale-nazione.png)

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial/pagina-analisi-generale-regione.png)

### 6. Linked Widget

Widgets with type `Linked Widget` are essentially a copy of another widget, i.e., the equivalent of copying the JSON document of a widget into another. Linked widgets allow to configure only once a widget that will be reused in several parts of the same dashboard. In the scope of this tutorial, two widgets configured in the first page of the dashboard will be reused in the second page: the header and the time slider.

Open the editor section of the second page and configure it as follows:

- Name: `details`
- Grid Columns: `4`
- Grid Rows: `5`

Create two widgets of type `Linked Widget`. Give the first one the following properties:

- Linked Widget: `Page 1: Header: Covid-19 Spreading across Italy` (identified in the JSON document as `0,0`, i.e. *<page_index,widget_index>*)
- Name: `header`
- Grid Rows: `1`
- Grid Columns: `4`

And the second one:

- Linked Widget: `Page 1: Slider` (identified in the JSON document as `0,1`)
- Name: `slider`
- Grid Rows: `4`
- Grid Columns: `1`

In addition to these, the second page will include four more widgets with details about the region (if selected) or the nation:

- a table with information on the number of tests performed, hospitalised patients and people in home confinement
- a bar chart with the number of cases for each province of the selected region (or for each Italian region)
- a table with the number of cases per million people, considering the number of inhabitants measured during the last ISTAT census
- a line chart with the number of new positive cases day by day up to the selected date

### 7. Table on the Health Situation

The data for the table are included in the same dataset already used for the counters and, as for the counters, they require some processing in a new datasource of type `JavaScript`. Create it and assign it the following properties:

- Name: `health-situation`
- Subscription To Parameters: `selectedDate`, `selectedRegion`
- Processor:

```
e = function(promise){
    var result = [];
    var day = Cyclotron.parameters.selectedDate;
    var region = Cyclotron.parameters.selectedRegion;
    var datasource = (region && region.Regione ? 'regional-data' : 'national-data');
    
    Cyclotron.dataSources[datasource].execute().then(function(dataset){
        var dayData = _.find(dataset['0'].data, function(d){
            if(region && region.Regione){
                return moment(d.data, 'YYYY-MM-DDTHH:mm:ss').isSame(moment(day, 'YYYY-MM-DD'), 'day') && d.denominazione_regione.includes(region.Regione);
            } else {
                return moment(d.data, 'YYYY-MM-DDTHH:mm:ss').isSame(moment(day, 'YYYY-MM-DD'), 'day');
            }
        });
        
        if(dayData){
            result = [{
                information: 'Hospitalised with symptoms',
                value: dayData.ricoverati_con_sintomi
            },{
                information: 'Intensive care',
                value: dayData.terapia_intensiva
            },{
                information: 'Total hospitalised',
                value: dayData.totale_ospedalizzati
            },{
                information: 'Home confinement',
                value: dayData.isolamento_domiciliare
            },{
                information: 'Tests performed',
                value: dayData.tamponi
            }];
        }
        
        promise.resolve(result);
    });
}
```

The function is very similar to that of the datasource `general-counters`, but the output is adjusted to the format required by the table, that is, a list of rows each one having two columns: *information* and *value*.

Create a new widget of type `Table` in the page `details` and configure it as follows:

- Name: `table`
- Title: `Health Situation - ${Cyclotron.parameters.selectedRegion && Cyclotron.parameters.selectedRegion.Regione ? Cyclotron.parameters.selectedRegion.Regione : 'Italy'}`
- Data Source: `health-situation`
- Omit Headers: `true`
- Grid Rows: `2`
- Grid Columns: `1`

The title includes some inline JavaScript code, identified by the notation `${}`. In this case, the code appends to the widget title either the name of the selected region, if any, or the string `Italy`.

Under the property *Columns*, add two columns and fill the *Name* field by entering `information` for the first column, `value` for the second one, i.e., the names assigned to the columns inside the datasource processor.

### 8. Bar Chart

In order to create the bar chart, a new `JSON` datasource is required to retrieve data at provincial level from the file https://github.com/pcm-dpc/COVID-19/blob/master/dati-json/dpc-covid19-ita-province.json.

Create a datasource of type `JSON` with the following properties:

- Name: `provincial-data`
- URL: `https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-province.json`
- Preload: `true`
- Deferred: `true`

And another one of type `JavaScript`, similar to those already created, which will process either provincial data for the selected region or regional data for the whole nation:

- Name: `distribution-of-cases`
- Subscription To Parameters: `selectedDate`, `selectedRegion`
- Processor:

```
e = function(promise){
    var result = [];
    var day = Cyclotron.parameters.selectedDate;
    var region = Cyclotron.parameters.selectedRegion;
    var datasource = (region && region.Regione ? 'provincial-data' : 'regional-data');
    
    Cyclotron.dataSources[datasource].execute().then(function(dataset){
        var dayData = _.filter(dataset['0'].data, function(d){
            if(region && region.Regione){
                return moment(d.data, 'YYYY-MM-DDTHH:mm:ss').isSame(moment(day, 'YYYY-MM-DD'), 'day') && d.denominazione_regione.includes(region.Regione);
            } else {
                return moment(d.data, 'YYYY-MM-DDTHH:mm:ss').isSame(moment(day, 'YYYY-MM-DD'), 'day');
            }
        });
        
        _.each(dayData, function(area){
            result.push({
                'Area': (region && region.Regione ? area.denominazione_provincia : area.denominazione_regione),
                'Total Cases': area.totale_casi
            });
        });
        
        promise.resolve(result);
    });
}
```

The chart will have the names of the provinces or regions on the horizontal axis. In the page `details`, create a widget of type `Google Charts` with the following configuration:

- Name: `barchart`
- Title: `Total Cases per ${Cyclotron.parameters.selectedRegion && Cyclotron.parameters.selectedRegion.Regione ? 'Province' : 'Region'}`
- Data Source: `distribution-of-cases`
- Chart Type: `ColumnChart`
- Grid Rows: `2`
- Grid Columns: `2`
- Options:

```
{
    "legend": "none",
    "chartArea": {
        "height": "50%",
        "left": "7%",
        "top": 19,
        "width": "90%"
    },
    "hAxis": {
        "showTextEvery": 1,
        "slantedText": "true"
    }
}
```

These are some of the options available to customize the chart. The complete list can be consulted in the documentation of the Google Charts library.

### 9. Table of Comparison with the Population and OData Datasource

The next widget will need a new datasource of type `OData`, as the portal DatiOpen.it exposes the data collected during the ISTAT 2011 census via its own OData service.

Create an `OData` datasource with the following properties:

- Name: `census-2011`
- URL: `http://www.datiopen.it//ODataProxy/MdData('4ca2b914-2eb0-4097-a985-5dddca9acf17@datiopen')/DataRows`
- Response Adapter: `Raw`
- Preload: `true`
- Deferred: `true`
- Post-Processor:

```
e = function(dataset){
    var data = _.map(dataset.d.results, function(d){
        var regionKey = _.find(_.keys(d), (key) => { return key.includes('regione'); });
        var totKey = _.find(_.keys(d), (key) => { return key.includes('totale'); });
        return {region: d[regionKey], population: parseInt(d[totKey], 10)};
    });
    return data;
}
```

The *Post-Processor* function can re-elaborate the result of the call to the service before returning it. In this case, the dataset is trimmed down by removing metadata and data about the population by gender, which are unnecessary for this dashboard.

At this point, create another datasource of type `JavaScript` to combine ISTAT data with Covid-19 cases:

- Name: `cases-per-million-people`
- Subscription To Parameters: `selectedDate`, `selectedRegion`
- Processor:

```
e = function(promise){
    var result = [];
    var day = Cyclotron.parameters.selectedDate;
    var region = Cyclotron.parameters.selectedRegion;
    
    Cyclotron.dataSources['regional-data'].execute().then(function(dataset1){
        var dayData = _.filter(dataset1['0'].data, function(d){
            return moment(d.data, 'YYYY-MM-DDTHH:mm:ss').isSame(moment(day, 'YYYY-MM-DD'), 'day');
        });
        
        if(dayData.length > 0){
            Cyclotron.dataSources['census-2011'].execute().then(function(dataset2){
                _.each(dayData, function(regionalCases){
                    var census = _.find(dataset2['0'].data, function(p){
                        return regionalCases.denominazione_regione.replace('-', ' ').includes(p.region.split('/')[0].replace('-', ' ')); //handle Bolzano ("Bolzano/Bozen") and Friuli ("Friuli-Venezia Giulia")
                    });
                    
                    var casesPerMillion = regionalCases.totale_casi / (census.population/1000000);
                    
                    result.push({
                        Region: regionalCases.denominazione_regione,
                        Cases: Math.round(casesPerMillion),
                        selected: (region && region.Regione && regionalCases.denominazione_regione.includes(region.Regione) ? true : false)
                    });
                });
                
                promise.resolve(result);
            });
        } else {
            promise.resolve([]);
        }
    });
}
```

The processor retrieves the data about the contagion, fetches the population of each region from the census dataset and calculates the number of cases per million people. The column `selected` will be used to highlight the row corresponding to the selected region, if there is one.

Now create a new widget of type `Table` on the `details` page and configure it as follows:

- Title: `Cases/Million People`
- Data Source: `cases-per-million-people`
- Omit Headers: `true`
- Sort By: `-Cases`
- Grid Rows: `2`
- Grid Columns: `1`

Under the *Columns* property, add two columns and fill the *Name* field with `Region` for the first column, with `Cases` for the second one. Under the *Rules* property, add the following rule, which will highlight in yellow the row matching the selected region:

- Rule: `#{selected}`
- Background Color (CSS): `yellow`

### 10. Line Chart

The last chart will display the evolution of positive cases measured day by day up to the selected date, either at regional level (if a region is selected) or at national level.

Create a new datasource of type `JavaScript` with the following properties:

- Name: `evolution-of-positive-cases`
- Subscription To Parameters: `selectedDate`, `selectedRegion`
- Processor:

```
e = function(promise){
    var result = [];
    var day = Cyclotron.parameters.selectedDate;
    var region = Cyclotron.parameters.selectedRegion;
    var datasource = (region && region.Regione ? 'regional-data' : 'national-data');
    
    Cyclotron.dataSources[datasource].execute().then(function(dataset){
        var dayData = _.filter(dataset['0'].data, function(d){
            if(region && region.Regione){
                return moment(d.data, 'YYYY-MM-DDTHH:mm:ss').isSameOrBefore(moment(day, 'YYYY-MM-DD'), 'day') && d.denominazione_regione.includes(region.Regione);
            } else {
                return moment(d.data, 'YYYY-MM-DDTHH:mm:ss').isSameOrBefore(moment(day, 'YYYY-MM-DD'), 'day');
            }
        });
        
        _.each(dayData, function(g){
            result.push({
                'Day': moment(g.data, 'YYYY-MM-DDTHH:mm:ss').format('DD/MM'),
                'New Positive Cases': g.nuovi_positivi
            });
        });
        
        promise.resolve(result);
    });
}
```

Lastly create a `Google Charts` widget on the `details` page and configure it as follows:

- Name: `positive-cases`
- Title: `Evolution of Positive Cases - ${Cyclotron.parameters.selectedRegion && Cyclotron.parameters.selectedRegion.Regione ? Cyclotron.parameters.selectedRegion.Regione : 'Italy'}`
- Data Source: `evolution-of-positive-cases`
- Chart Type: `LineChart`
- Grid Rows: `2`
- Grid Columns: `2`
- Options:

```
{
    "legend": "none",
    "chartArea": {
        "height": "60%",
        "left": "7%",
        "top": 19,
        "width": "90%"
    },
    "hAxis": {
        "showTextEvery": 5
    }
}
```

You completed also the second page of the dashboard. Here is the result you should visualise:

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial/pagina-dettaglio-nazione.png)

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial/pagina-dettaglio-regione.png)

### 11. Encryption

In case the configuration of some datasource contains sensitive data, e.g. credentials, Cyclotron provides a service for encrypting strings that require protection, which will be decrypted only when the datasource is executed inside the proxy service.

In the editor of each dashboard, you can access the encryption service from the menu on the left: clicking on *Encrypt...* will open a popup where you can enter a string and copy the encrypted result, already wrapped in the notation `!{}`, which will signal to the proxy service the presence of a string to decrypt before executing the datasource.

The sources used in this tutorial are not protected, but let us suppose they require a key (e.g. an API key) to be sent as a query parameter in the request:

*https://github.com/pcm-dpc/COVID-19/raw/master/dati-json/dpc-covid19-ita-regioni.json?secretkey=mykey123456789*

The key can be encrypted inside the datasource configuration, so that it is never visible in cleartext inside the browser. You can either encrypt just the query parameter as a key-value pair inside the *Query Parameters* property:

- key: `secretkey`
- value: `!{lByxOaWRKKOfVGKkCFS09w==}`

or encrypt partially or completely the URL:

- URL: `https://github.com/pcm-dpc/COVID-19/raw/master/dati-json/dpc-covid19-ita-regioni.json?secretkey=!{lByxOaWRKKOfVGKkCFS09w==}`

Similarly you can encrypt other parts of the datasource configuration, such as AWS credentials (inside the *AWS Credentials* property) and OAuth2.0 credentials (inside the *OAuth2.0 Client Credentials* property).
