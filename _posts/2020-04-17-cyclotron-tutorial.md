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

I dati utilizzati si riferiscono alla diffusione del virus Covid-19 in Italia e sono resi disponibili dalla Protezione Civile sulla seguente repository: https://github.com/pcm-dpc/COVID-19. Le altre fonti dati utilizzate sono:

- confini amministrativi delle regioni italiane, forniti da https://gist.github.com/datajournalism-it
- popolazione residente per regione, rilevata dal censimento ISTAT 2011 ed esposta sul portale DatiOpen.it, http://www.datiopen.it/it/opendata/Censimento_2011_Popolazione_per_regione_e_sesso

Nella cartella https://github.com/etomaselli/hello-world/tree/master/tutorial sono presenti alcuni screenshot della dashboard e il suo documento JSON completo.

### 1. Creazione di una Nuova Dashboard

Dall'interfaccia di Cyclotron, crea una nuova dashboard denominata `analisi-covid19-italia`. Nella sezione *Details* dell'editor si possono configurare le proprietà generali della dashboard, come il tema grafico o la barra laterale. Poiché ogni dashboard viene salvata come documento JSON, cliccando sul pulsante *Edit JSON* si può visualizzare e modificare direttamente tale documento.

Questo è un esempio della configurazione iniziale della dashboard:

```
{
    "description": "Analisi della diffusione del virus Covid-19 in Italia",
    "name": "analisi-covid19-italia",
    "pages": [],
    "showDashboardControls": false,
    "sidebar": {
        "showDashboardSidebar": false
    },
    "theme": "light"
}
```

La dashboard di questo tutorial sarà composta da due pagine: la prima mostrerà la mappa dell'Italia e alcuni dati giornalieri generali, a livello nazionale oppure filtrati per regione tramite la selezione dalla mappa; la seconda permetterà un'analisi più dettagliata. In entrambe le pagine, uno slider temporale permetterà di selezionare il giorno da analizzare.

### 2. Intestazione

Nella sezione *Pages* dell'editor, crea due pagine tramite il pulsante *Add Page* e apri la prima. Le proprietà principali delle pagine sono il numero di righe e il numero di colonne in cui verranno suddivise per formare una griglia in cui posizionare i widget.

Alla prima pagina assegna le seguenti proprietà:

- Name: `analisi-generale`
- Grid Columns: `4`
- Grid Rows: `5`

Per aggiungere alla dashboard un'intestazione e i pulsanti di navigazione tra le pagine, crea un nuovo widget tramite il pulsante *Add Widget*, assegnagli il tipo `Header` e le seguenti proprietà:

- Title: `Diffusione del Virus Covid-19 in Italia`
- Show Title: `true`
- Show Parameters: `false`
- Grid Rows: `1`
- Grid Columns: `4`

Per aggiungere i pulsanti di navigazione occorre creare un apposito script HTML nel riquadro della proprietà *HTML Content*; lo script verrà compilato e aggiunto sotto il titolo del widget. Dato che l'installazione di Cyclotron include Bootstrap 3, si può usare per dare uno stile agli elementi HTML senza bisogno di importarlo.

```
<div class="button-group" align="center">
    <button class="btn btn-default" id="gen">Analisi Generale</button>
    <button class="btn btn-default" id="det">dettaglio</button>
</div>
<script>
    // La funzione goToPage(pageNum) permette di navigare alla pagina specificata
    $('#gen').on('click', function () {
        Cyclotron.goToPage(1);
    });
    $('#det').on('click', function () {
        Cyclotron.goToPage(2);
    });
</script>
```

Dopo aver salvato e cliccato sul pulsante *Preview*, potrai visualizzare la dashboard con il widget appena creato.

### 3. Slider Temporale

Crea nella stessa pagina un altro widget, assegnagli il tipo `Slider` e configuralo con le seguenti proprietà, per specificare l'intervallo di tempo e la scala di valori da visualizzare accanto allo slider:

- Minimum date-time: `2020-02-24`
- Maximum date-time: `#{dataDiOggi}`
- Date-time Format: `YYYY-MM-DD`
- Step: `1`
- Pips.Mode: `count`
- Pips.Values: `5`
- Pips.Stepped: `true`
- Grid Rows: `4`
- Grid Columns: `1`
- Orientation: `vertical`
- Direction: `rtl` (right-to-left o da sotto a sopra)
- Tooltips: `true`
- Initial Handle Position: `#{dataSelezionata}`

La stringa `#{dataDiOggi}` è un placeholder e indica che il valore da assegnare, per esempio, alla proprietà *Maximum date-time* corrisponde a quello del parametro **dataDiOggi**, che creerai tra poco. Cerca la proprietà *Subscription To Parameters*, clicca sul pulsante *Add Subscription to Parameters* e inserisci il nome del parametro, `dataDiOggi`. Quando il widget verrà caricato e ad ogni eventuale aggiornamento del parametro, il placeholder verrà sostituito con il valore attuale di **dataDiOggi**.

Nella sezione *Parameters* dell'editor della dashboard, clicca il pulsante *Add Parameter* e assegna al nuovo parametro le seguenti proprietà:

- Name: `dataDiOggi`
- Default Value: `${moment().format('YYYY-MM-DD')}`
- Show in URL: `false`

Il valore di default sarà la data di oggi, nello stesso formato utilizzato dallo slider.

Crea un altro parametro con le seguenti proprietà:

- Name: `dataSelezionata`
- Default Value: `${moment().format('YYYY-MM-DD')}`
- Show in URL: `false`

Il parametro **dataSelezionata** conterrà la data selezionata tramite lo slider e verrà utilizzato dagli altri componenti della dashboard per filtrare i dati. Inizialmente avrà come valore la data di oggi, ma si aggiornerà ogni volta che verrà selezionata una nuova data tramite lo slider.

Crea anche un ultimo parametro, configurato come segue, che servirà per la selezione di una regione in mappa:

- Name: `regioneSelezionata`
- Show in URL: `false`

Per configurare la gestione della selezione di una data, torna sulla sezione dell'editor dedicata allo slider, cerca la proprietà *Specific Events*, clicca sul pulsante *Add param-event* e popola i seguenti campi:

- Parameter Name: `dataSelezionata`
- Event: `dateTimeChange`

In questo modo, ad ogni evento "cambio data" il parametro cambierà valore. Puoi cliccare su *Preview* per visualizzare lo stato della dashboard.

Adesso il documento JSON completo del widget slider dovrebbe essere questo:

```
{
    "direction": "rtl",
    "gridHeight": 4,
    "gridWidth": 1,
    "handlePosition": "#{dataSelezionata}",
    "maxValue": "#{dataDiOggi}",
    "minValue": "2020-02-24",
    "momentFormat": "YYYY-MM-DD",
    "orientation": "vertical",
    "parameterSubscription": ["dataDiOggi"],
    "pips": {
        "mode": "count",
        "stepped": true,
        "values": "5"
    },
    "player": {},
    "specificEvents": [{
        "event": "dateTimeChange",
        "paramName": "dataSelezionata"
    }],
    "step": 1,
    "tooltips": true,
    "widget": "slider"
}
```

### 4. Contatori

Il file JSON https://github.com/pcm-dpc/COVID-19/blob/master/dati-json/dpc-covid19-ita-andamento-nazionale.json contiene i dati sul numero di contagi, ricoveri, decessi, tamponi registrati giorno per giorno a livello nazionale, mentre il file https://github.com/pcm-dpc/COVID-19/blob/master/dati-json/dpc-covid19-ita-regioni.json contiene i medesimi dati per ciascuna regione. Questi dati possono essere analizzati sulla dashboard tramite la configurazione di alcune datasource, che li recupereranno e rielaboreranno per la visualizzazione in un widget.

Nella sezione *Data Sources* dell'editor, clicca sul pulsante *Add Data source* per creare una nuova datasource di tipo `JSON`, che può prendere i dati sia da un servizio web sia da un file .json. Assegnale le seguenti proprietà per richiedere i dati nazionali:

- Name: `dati-nazionali`
- URL: `https://github.com/pcm-dpc/COVID-19/raw/master/dati-json/dpc-covid19-ita-andamento-nazionale.json`
- Preload: `true`
- Deferred: `true`

Crea una seconda datasource di tipo `JSON` per richiedere i dati regionali:

- Name: `dati-regionali`
- URL: `https://github.com/pcm-dpc/COVID-19/raw/master/dati-json/dpc-covid19-ita-regioni.json`
- Preload: `true`
- Deferred: `true`

Infine crea una terza datasource, di tipo `JavaScript`, con le seguenti proprietà:

- Name: `contatori-generali`
- Subscription To Parameters: `dataSelezionata`, `regioneSelezionata`
- Processor:

```
e = function(promise){
    var result = [];
    var day = Cyclotron.parameters.dataSelezionata;
    var region = Cyclotron.parameters.regioneSelezionata;
    var datasource = (region && region.Regione ? 'dati-regionali' : 'dati-nazionali');
    
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

La datasource si aggiornerà ogni volta che i parametri **dataSelezionata** o **regioneSelezionata** avranno un nuovo valore, il quale verrà usato per filtrare tra i dati solo quelli relativi alla data e/o alla regione selezionata. La proprietà *Processor* è una funzione JavaScript che verifica quali filtri sono stati impostati, elabora i dati e li restituisce in maniera sincrona. A seconda che sia o non sia presente una regione selezionata, la funzione esegue la datasource per i dati nazionali o regionali, cerca nel dataset (che in entrambi i casi è un'array di giorni con i relativi dati) il sottoinsieme corrispondente alla data e/o regione selezionata e preparare i dati per il widget che li riceverà.

Ora che il recupero dei dati è stato predisposto, torna alla pagina `analisi-generale` e crea quattro nuovi widget di tipo `Number`, ognuno con le seguenti proprietà (puoi copiare il documento JSON del primo nell'editor JSON degli altri):

- Data Source: `contatori-generali`
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
    
    if(Cyclotron.parameters.regioneSelezionata && Cyclotron.parameters.regioneSelezionata.Regione == feature.getProperties().Regione){
        return styles.sel;
    } else {
        return styles.desel;
    }
}
```

Individua tra le proprietà della mappa quella denominata *Specific Events*, clicca sul pulsante *Add param-event* e configura l'evento come segue:

- Parameter Name: `regioneSelezionata`
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
- Subscription To Parameters: `dataSelezionata`, `regioneSelezionata`
- Processor:

```
e = function(promise){
    var result = [];
    var day = Cyclotron.parameters.dataSelezionata;
    var region = Cyclotron.parameters.regioneSelezionata;
    var datasource = (region && region.Regione ? 'dati-regionali' : 'dati-nazionali');
    
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

La funzione è molto simile a quella della datasource `contatori-generali`, ma l'output è adattato a quello richiesto dalla tabella, ovvero una lista di righe aventi ognuna due colonne, *dato* e *valore*.

Crea un nuovo widget di tipo `Table` nella pagina `dettaglio` e configuralo come segue:

- Name: `table`
- Title: `Dati Sanitari - ${Cyclotron.parameters.regioneSelezionata && Cyclotron.parameters.regioneSelezionata.Regione ? Cyclotron.parameters.regioneSelezionata.Regione : 'Italia'}`
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
- Subscription To Parameters: `dataSelezionata`, `regioneSelezionata`
- Processor:

```
e = function(promise){
    var result = [];
    var day = Cyclotron.parameters.dataSelezionata;
    var region = Cyclotron.parameters.regioneSelezionata;
    var datasource = (region && region.Regione ? 'dati-provinciali' : 'dati-regionali');
    
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
- Title: `Casi Totali per ${Cyclotron.parameters.regioneSelezionata && Cyclotron.parameters.regioneSelezionata.Regione ? 'Provincia' : 'Regione'}`
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
- Subscription To Parameters: `dataSelezionata`, `regioneSelezionata`
- Processor:

```
e = function(promise){
    var result = [];
    var day = Cyclotron.parameters.dataSelezionata;
    var region = Cyclotron.parameters.regioneSelezionata;
    
    Cyclotron.dataSources['dati-regionali'].execute().then(function(dataset1){
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
- Subscription To Parameters: `dataSelezionata`, `regioneSelezionata`
- Processor:

```
e = function(promise){
    var result = [];
    var day = Cyclotron.parameters.dataSelezionata;
    var region = Cyclotron.parameters.regioneSelezionata;
    var datasource = (region && region.Regione ? 'dati-regionali' : 'dati-nazionali');
    
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
- Title: `Andamento Nuovi Positivi - ${Cyclotron.parameters.regioneSelezionata && Cyclotron.parameters.regioneSelezionata.Regione ? Cyclotron.parameters.regioneSelezionata.Regione : 'Italia'}`
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
