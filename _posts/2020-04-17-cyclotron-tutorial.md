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


Ora che il recupero dei dati è stato predisposto, torna alla pagina `analisi-generale` e crea quattro nuovi widget di tipo `Number`, ognuno con le seguenti proprietà (puoi copiare il documento JSON del primo nell'editor JSON degli altri):

- Data Source: `general-counters`
- Grid Rows: `1`
- Grid Columns: `1`
- No Data Message: `Dati non disponibili per la data scelta`

Adesso tutti e quattro i widget leggeranno la stessa datasource, ma ognuno esporrà uno dei dati. La proprietà *Numbers* può essere usata per mostrare una serie di valori statici oppure provenienti dalla datasource (tramite la sintassi `#{campo_valore}`). Nel primo widget di tipo `Number`, cliccando sul pulsante *Add number*, crea un numero con le seguenti proprietà:

- Number: `#{totale_casi}`
- Prefix: `Totale Casi`

Fai lo stesso per il secondo widget:

- Number: `#{totale_positivi}`
- Prefix: `Totale Positivi`

Il terzo:

- Number: `#{dimessi_guariti}`
- Prefix: `Dimessi Guariti`

E infine il quarto:

- Number: `#{deceduti}`
- Prefix: `Decessi`

Se clicchi nuovamente su *Preview* e provi a cambiare la data selezionata con lo slider, vedrai che i quattro contatori si aggiorneranno con i dati relativi al giorno scelto o, nel caso questi non fossero disponibili, con il messaggio impostato. Quando la mappa sarà configurata, i contatori si aggiorneranno anche in risposta alla selezione di una regione.

Al momento i quattro widget saranno disposti sulla dashboard da sinistra a destra, nell'ordine in cui sono elencati nella pagina. Nel prossimo passaggio verrà aggiunto l'ultimo widget della pagina e i contatori si incolonneranno per riempire lo spazio sulla griglia.

### 5. Dati Geografici e Mappa Interattiva

La mappa che stai per creare avrà i seguenti elementi:

- layer OSM: mappa geografica di base
- layer vettoriale con i confini regionali: ogni regione sarà rappresentata come una feature GeoJSON che, se selezionata con un click, permetterà di procedere con l'analisi dei dati regionali nella seconda pagina della dashboard

Torna alla pagina `analisi-generale`, clicca su *Add Widget* e poi trascina il nuovo widget tra quello di tipo `Slider` e il primo di tipo `Number`, in modo che sia al terzo posto nell'elenco dei widget inclusi nella pagina. Assegna al nuovo widget le seguenti proprietà:

- Widget Type: `OpenLayers Map`
- Center.X: `13`
- Center.Y: `42`
- Zoom: `5`
- Grid Rows: `4`
- Grid Columns: `2`
- Controls: `Zoom`

Alla proprietà *Layers*, cliccando su *Add Layer* aggiungi due layers. Al primo, che sarà un layer di base in colori neutrali, assegna le seguenti proprietà:

- Type: `tile`
- Source.Name: `Stamen`
- Source.Configuration:

```
{
    "layer": "toner-lite"
}
```

Il secondo layer sarà di tipo vettoriale e rappresenterà i confini regionali:

- Type: `vector`
- Source.Name: `Vector`
- Source.Configuration:

```
{
    "format": new ol.format.GeoJSON(),
    "url": "https://gist.githubusercontent.com/datajournalism-it/f1abb68e718b54f6a0fe/raw/23636ff76534439b52b87a67e766b11fa7373aa9/regioni-con-trento-bolzano.geojson"
}
```

A questo punto, salvando e aprendo il preview della dashboard, sarà già visibile la mappa con i confini regionali, senza però che le regioni siano selezionabili. Per completare la configurazione, torna al layer vettoriale appena creato e assegna alla proprietà *Style function* il seguente valore, per dare uno stile alle features rappresentate in mappa:

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

Individua tra le proprietà della mappa quella denominata *Specific Events*, clicca sul pulsante *Add param-event* e configura l'evento come segue:

- Parameter Name: `selectedRegion`
- Event: `selectVectorFeature`

Infine, nella sezione *Scripts*, crea un nuovo script con le seguenti proprietà:

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

La funzione appena definita verrà utilizzata per assegnare uno stile alle features selezionate. Adesso la prima pagina della dashboard è completa.

### 6. Linked Widget

I widget di tipo `Linked Widget` sono sostanzialmente una copia di un altro widget, ovvero l'equivalente del copiare il documento JSON da un widget ad un altro. Permettono di configurare in un unico posto un widget che verrà riutilizzato in più parti della stessa dashboard. In questo caso, due widget configurati nella prima pagina della dashboard saranno riutilizzati nella seconda: l'intestazione e lo slider temporale.

Vai alla sezione dell'editor dedicata alla seconda pagina e configurala come segue:

- Name: `dettaglio`
- Grid Columns: `4`
- Grid Rows: `5`

Crea due nuovo widget di tipo `Linked Widget`. Configura il primo con le seguenti proprietà:

- Linked Widget: `Page 1: Header: Diffusione del Virus Covid-19 in Italia` (identificato nel documento JSON come `0,0`, cioè *<indice_pagina,indice_widget>*)
- Name: `intestazione`
- Grid Rows: `1`
- Grid Columns: `4`

E il secondo:

- Linked Widget: `Page 1: Slider` (identificato nel documento JSON come `0,1`)
- Name: `slider`
- Grid Rows: `4`
- Grid Columns: `1`

Oltre a questi, la seconda pagina conterrà altri quattro widget di dettaglio sulla regione (se selezionata) o sulla nazione:

- una tabella con dati relativi al numero di tamponi effettuati, pazienti ricoverati e in isolamento domiciliare
- un grafico a barre con i casi rilevati per ogni provincia della regione (o per ogni regione d'Italia)
- una tabella con il numero di casi per milione di abitanti, considerato il numero di abitanti rilevato all'ultimo censimento ISTAT
- un grafico a linee con i nuovi casi positivi giorno per giorno fino alla data scelta

### 7. Tabella dei Dati Sanitari

I dati per la tabella fanno parte del dataset che hai già utilizzato per i contatori della prima pagina e, allo stesso modo, vanno rielaborati in una nuova datasource di tipo `JavaScript`. Creane una con le seguenti proprietà:

- Name: `dati-sanitari`
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
                dato: 'Ricoverati con sintomi',
                valore: dayData.ricoverati_con_sintomi
            },{
                dato: 'Terapia intensiva',
                valore: dayData.terapia_intensiva
            },{
                dato: 'Totale ospedalizzati',
                valore: dayData.totale_ospedalizzati
            },{
                dato: 'Isolamento domiciliare',
                valore: dayData.isolamento_domiciliare
            },{
                dato: 'Tamponi',
                valore: dayData.tamponi
            }];
        }
        
        promise.resolve(result);
    });
}
```

La funzione è molto simile a quella della datasource `general-counters`, ma l'output è adattato a quello richiesto dalla tabella, ovvero una lista di righe aventi ognuna due colonne, *dato* e *valore*.

Crea un nuovo widget di tipo `Table` nella pagina `dettaglio` e configuralo come segue:

- Name: `table`
- Title: `Dati Sanitari - ${Cyclotron.parameters.selectedRegion && Cyclotron.parameters.selectedRegion.Regione ? Cyclotron.parameters.selectedRegion.Regione : 'Italia'}`
- Data Source: `dati-sanitari`
- Omit Headers: `true`
- Grid Rows: `2`
- Grid Columns: `1`

Il titolo contiene del codice JavaScript inline, indicato dalla notazione `${}`. In questo caso, il codice aggiunge al titolo del widget il nome della regione selezionata, se presente, oppure la stringa `Italia`.

Alla proprietà *Columns*, aggiungi due colonne e, nel campo *Name*, inserisci `dato` per la prima, `valore` per la seconda, ovvero i nomi assegnati alle colonne nel processore della datasource.

### 8. Grafico a Barre

Per creare il grafico a barre, è necessario configurare una nuova datasource di tipo `JSON` che legga i dati a livello provinciale, contenuti nel file https://github.com/pcm-dpc/COVID-19/blob/master/dati-json/dpc-covid19-ita-province.json.

Crea una datasource `JSON` con le seguenti proprietà:

- Name: `dati-provinciali`
- URL: `https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-province.json`
- Preload: `true`
- Deferred: `true`

E un'altra di tipo `JavaScript`, simile a quelle create in precedenza, che elaborerà i dati provinciali per la regione selezionata oppure regionali per tutta la nazione:

- Name: `suddivisione-casi`
- Subscription To Parameters: `selectedDate`, `selectedRegion`
- Processor:

```
e = function(promise){
    var result = [];
    var day = Cyclotron.parameters.selectedDate;
    var region = Cyclotron.parameters.selectedRegion;
    var datasource = (region && region.Regione ? 'dati-provinciali' : 'regional-data');
    
    Cyclotron.dataSources[datasource].execute().then(function(dataset){
        var dayData = _.filter(dataset['0'].data, function(d){
            if(region && region.Regione){
                return moment(d.data, 'YYYY-MM-DDTHH:mm:ss').isSame(moment(day, 'YYYY-MM-DD'), 'day') && d.denominazione_regione.includes(region.Regione);
            } else {
                return moment(d.data, 'YYYY-MM-DDTHH:mm:ss').isSame(moment(day, 'YYYY-MM-DD'), 'day');
            }
        });
        
        _.each(dayData, function(zona){
            result.push({
                'Zona': (region && region.Regione ? zona.denominazione_provincia : zona.denominazione_regione),
                'Casi Totali': zona.totale_casi
            });
        });
        
        promise.resolve(result);
    });
}
```

Il grafico avrà sull'asse orizzontale i nomi delle province o delle regioni. Nella pagina `dettaglio` crea un widget di tipo `Google Charts` con la seguente configurazione:

- Name: `barchart`
- Title: `Casi Totali per ${Cyclotron.parameters.selectedRegion && Cyclotron.parameters.selectedRegion.Regione ? 'Provincia' : 'Regione'}`
- Data Source: `suddivisione-casi`
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

Questo è un esempio di alcune delle opzioni con cui è possibile personalizzare il grafico. La lista completa è disponibile nella documentazione della libreria Google Charts.

### 9. Tabella di Confronto con la Popolazione e Fonte OData

Anche per il prossimo widget servirà una nuova datasource, questa volta di tipo `OData`, poiché il portale DatiOpen.it mette a disposizione tramite il proprio servizio OData i dati sulla popolazione residente raccolti da ISTAT durante il censimento del 2011.

Crea una datasource `OData` con le seguenti proprietà:

- Name: `censimento-2011`
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
        return {regione: d[regionKey], residenti: parseInt(d[totKey], 10)};
    });
    return data;
}
```

La funzione in *Post-Processor* può elaborare il risultato della chiamata al servizio prima di restituirlo. In questo caso, il dataset viene ripulito dai metadati e dai dati sui residenti divisi per genere, non necessari per questa dashboard.

A questo punto, crea una datasource di tipo `JavaScript` per combinare i dati ISTAT con quelli sui contagi:

- Name: `casi-su-popolazione`
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
            Cyclotron.dataSources['censimento-2011'].execute().then(function(dataset2){
                _.each(dayData, function(casiRegionali){
                    var censimento = _.find(dataset2['0'].data, function(p){
                        return casiRegionali.denominazione_regione.replace('-', ' ').includes(p.regione.split('/')[0].replace('-', ' ')); //gestisci Bolzano ("Bolzano/Bozen") e Friuli ("Friuli-Venezia Giulia")
                    });
                    
                    var casiPerMilione = casiRegionali.totale_casi / (censimento.residenti/1000000);
                    
                    result.push({
                        Regione: casiRegionali.denominazione_regione,
                        Casi: Math.round(casiPerMilione),
                        selezionata: (region && region.Regione && casiRegionali.denominazione_regione.includes(region.Regione) ? true : false)
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

Il processore recupera i dati sui contagi e, per ogni regione, identifica il numero di residenti nel dataset con il censimento e calcola il numero di contagi registrati per milione di abitanti. La colonna `selezionata` servirà per colorare la riga corrispondente alla regione selezionata, se presente.

Adesso crea un nuovo widget di tipo `Table` sulla pagina `dettaglio` e configuralo come segue:

- Title: `Casi/milione di Abitanti`
- Data Source: `casi-su-popolazione`
- Omit Headers: `true`
- Sort By: `-Casi`
- Grid Rows: `2`
- Grid Columns: `1`

Sotto la proprietà *Columns*, aggiungi due colonne e popola il campo *Name* con `Regione` per la prima, `Casi` per la seconda. Sotto la proprietà *Rules*, crea una regola con cui colorare di giallo la riga corrispondente alla regione selezionata, configurandola come segue:

- Rule: `#{selezionata}`
- Background Color (CSS): `yellow`

### 10. Grafico a Linee

L'ultimo grafico rappresenterà l'andamento dei casi positivi rilevati giorno per giorno fino alla data scelta, a livello regionale nel caso ci sia una regione selezionata, altrimenti nazionale.

Crea una nuova datasource di tipo `JavaScript` con le seguenti proprietà:

- Name: `andamento-positivi`
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
        
        _.each(dayData, function(giorno){
            result.push({
                'Giorno': moment(giorno.data, 'YYYY-MM-DDTHH:mm:ss').format('DD/MM'),
                'Nuovi Positivi': giorno.nuovi_positivi
            });
        });
        
        promise.resolve(result);
    });
}
```

Infine nella pagina `dettaglio` crea un widget di tipo `Google Charts` con la seguente configurazione:

- Name: `positivi`
- Title: `Andamento Nuovi Positivi - ${Cyclotron.parameters.selectedRegion && Cyclotron.parameters.selectedRegion.Regione ? Cyclotron.parameters.selectedRegion.Regione : 'Italia'}`
- Data Source: `andamento-positivi`
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

### 11. Encryption

Nel caso in cui la configurazione di una datasource contenga dati sensibili, come per esempio credenziali, Cyclotron consente di criptare le stringhe che necessitano di protezione, le quali verranno decriptate al momento dell'esecuzione della datasource da parte del servizio di proxy.

Nell'editor di ogni dashboard, dal menu a sinistra si può accedere al servizio di encryption: cliccando su *Encrypt...* si aprirà una finestra da cui sarà possibile inserire una stringa e copiare la stringa criptata e già racchiusa nella notazione `!{}`, che indicherà al servizio di proxy la presenza di una stringa da decriptare prima di eseguire la datasource.

Le fonti di dati utilizzate per questo tutorial non sono protette, ma supponiamo che richiedano una chiave (es. una API key) trasmessa come parametro nella richiesta:

*https://github.com/pcm-dpc/COVID-19/raw/master/dati-json/dpc-covid19-ita-regioni.json?secretkey=mykey123456789*

La chiave può essere criptata nella configurazione della datasource, in modo che non sia mai visibile in chiaro nel browser. Si può criptare il singolo parametro come coppia chiave-valore nella proprietà *Query Parameters*:

- chiave: `secretkey`
- valore: `!{lByxOaWRKKOfVGKkCFS09w==}`

oppure criptare direttamente in parte o tutto l'URL:

- URL: `https://github.com/pcm-dpc/COVID-19/raw/master/dati-json/dpc-covid19-ita-regioni.json?secretkey=!{lByxOaWRKKOfVGKkCFS09w==}`

Allo stesso modo possono essere criptate altre parti della configurazione delle datasource, come le credenziali AWS (nella proprietà *AWS Credentials*) o OAuth2.0 (nella proprietà *OAuth2.0 Client Credentials*).
