---
layout: single
title:  "Dremio Tutorial - Virtual Datasets Based on Heterogeneous Sources"
date:   2021-07-14 18:00:00 +0200
categories: platform
author: erica.tomaselli
---
This tutorial illustrates how Dremio can be used to create virtual datasets starting from heterogeneous sources and including only the desired data.

The data sources used are:

- data about the spread of Covid-19 desease across Italy, made available by the Civil Protection Department on its repository https://github.com/pcm-dpc/COVID-19, at national (dpc-covid19-ita-andamento-nazionale.json), regional (dpc-covid19-ita-regioni.json) and provincial level (dpc-covid19-ita-province.json)
- the number of people per region according to the 2011 census conducted by ISTAT, exposed on the open data portal DatiOpen.it, http://www.datiopen.it/it/opendata/Censimento_2011_Popolazione_per_regione_e_sesso

Dremio enables the creation of new datasets based on both sources, as well as the re-elaboration of the data about the virus spread, which can be enriched by joining it with the population data.

The tutorial will be followed by another one on visualizing Dremio datasets via different tools.

### 1. Downloading the Data

Download the [COVID-19](https://github.com/pcm-dpc/COVID-19) repository as a .zip file and extract it. The folder named "dati-json" contains three JSON files with the number of cases, hospitalizations, deaths, tests registered day by day since February 2020:

- "dpc-covid19-ita-andamento-nazionale.json": national level (each object represents a day)
- "dpc-covid19-ita-regioni.json": regional level (each object represents a day and a region)
- "dpc-covid19-ita-province.json": overall cases at provincial level (each object represents a day and a province)

The same data is also available in CSV format, respectively in "dati-andamento-nazionale", "dati-regioni" and "dati-province" folders. Dremio supports both file formats. JSON files are used throughout the tutorial.

The dataset structure and the field descriptions are available [on the repository](https://github.com/pcm-dpc/COVID-19/blob/master/dati-andamento-covid19-italia.md).

Navigate to the [2011 census page](http://www.datiopen.it/it/opendata/Censimento_2011_Popolazione_per_regione_e_sesso) on DatiOpen.it, open the "Scarica" ("Download") tab and export the dataset in CSV format. Each file line contains the male, female and whole population of a region.

### 2. Uploading the Data on Dremio

On your Dremio home, click on the **Upload file** button, browse the "dati-json" folder and select the file "dpc-covid19-ita-andamento-nazionale.json" (or drag and drop it). Click on **Next** to preview the data in table format. Click on **Save** and proceed to upload the files "dpc-covid19-ita-regioni.json" and "dpc-covid19-ita-province.json". Lastly, upload the file "Censimento-2011---Popolazione-per-regione-e-sesso.csv" and rename it "censimento-2011" for brevity. You need to change **Field Delimiter** to `Custom...` and enter `;` as its value, then check **Extract Field Names** in order to get the column names from the first row.

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial-dremio/upload.png)

### 3. Adapting the Census Dataset

Some regions are named differently in the dataset "censimento-2011" than they are in the Civil Protection Department datasets. Prior to joining them, they must match with each other. On your Dremio home, click on "censimento-2011" to open it, highlight the first occurrence of the string "Friuli-Venezia Giulia" in the column *Regione* and select **Replace...** from the dropdown menu that will appear. In the editor you can replace the highlighted string with a new value throughout the whole *Regione* column (Dremio will actually create a new column named "Regione" and remove the old one). Fill the **Replacement value** field with the string `Friuli Venezia Giulia` and click on **Apply**. Follow the same procedure to replace the value "Bolzano/Bozen" with "P.A. Bolzano" and "Trento" with "P.A. Trento".

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial-dremio/censimento.png)

If you see the icon "Abc" before *Femmine*, *Maschi* and *Totale* column names, it means Dremio has interpreted their values as text. Click on the icon, select **Integer...** and click on **Apply** to convert them to numbers. Then click on **Save as...** in the upper right hand corner, name the new virtual dataset "censimento-2011-conformed" and save it in your home.

### 4. Adding Population to the Regional Dataset

In order to add the population of each region to the regional Covid data, you can pick either of the two joining methods provided by Dremio: a graphical editor or a SQL query.

**Join in the Editor**

On your Dremio home, click on the dataset " dpc-covid19-ita-regioni" and then on the **Join** button in the upper left hand corner. On the editor page, select the dataset "censimento-2011-conformed" you created earlier and click on **Next**. Now you have to add a join condition: the matching columns are *denominazione_regione* from "dpc-covid19-ita-regioni" and *Regione* for "censimento-2011-conformed"; drag and drop them from their respective field list so that you set the condition `denominazione_regione = Regione`. If you click on **Preview**, the columns of both datasets will be displayed side by side in the result table. Click on **Apply** to confirm the join.

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial-dremio/join1.png)

**Join in a Query**

On your Dremio home, click on **New Query** and insert the following query in the SQL editor, then click on **Preview** and the columns of both datasets will be displayed side by side in the result table:

```
SELECT * FROM "@dremio"."dpc-covid19-ita-regioni" regioni
JOIN "@dremio"."censimento-2011-conformed" censimento
ON regioni.denominazione_regione = censimento.Regione
```

Either way, now the new dataset contains all the columns from both of the original datasets. Rename the column *Totale* to *popolazione* to make it clearer. At this stage you can decide which columns to keep and which ones shall be excluded from the final result, e.g. because they contain extra or irrelevant information. You can remove a column by clicking on the arrow next to its name and selecting **Drop**. Keep the columns *data*, *lat*, *long*, *denominazione_regione*, *ricoverati_con_sintomi*, *terapia_intensiva*, *totale_ospedalizzati*, *isolamento_domiciliare*, *totale_positivi*, *dimessi_guariti*, *deceduti*, *totale_casi* and *popolazione* and drop the other ones.

Click on **Save As...** in the upper right hand side and name the new virtual dataset "covid19-ita-regioni-with-population".

### 5. Calculating Regional Values per 100000 People

Let us suppose today two regions have 1000 positive cases each but the first one has ten times the population of the second one; the epidemiological situation of the second region is more critical than it would appear if you compared just the absolute number of positive cases per region. In order to compare the evolution of the pandemics between different regions, it can be useful to scale the regional daily amount of hospitalized, home-confined, currently positive, etc. using a benchmark number, such as 100000 people.

On your Dremio home, click on the dataset "covid19-ita-regioni-with-population" to use it as a starting point. Drop the columns *dimessi_guariti*, *deceduti* and *totale_casi*, as they contain counters and therefore absolute values. The remaining columns can be modified so that they contain values per 100000 people.

Click on the arrow next to the column name "ricoverati_con_sintomi", select **Calculated field...** and insert the following expression into the text area:

```
"ricoverati_con_sintomi"/("popolazione"/100000)
```

If you click on **Preview**, the result table will display both the original column and the new one with calculated values, which will replace the first one. Click on **Apply** to confirm the operation.

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial-dremio/calcolo.png)

Follow the same transformation steps for the columns *terapia_intensiva* (`"terapia_intensiva"/("popolazione"/100000)`), *totale_ospedalizzati* (`"totale_ospedalizzati"/("popolazione"/100000)`), *isolamento_domiciliare* (`"isolamento_domiciliare"/("popolazione"/100000)`) and *totale_positivi* (`"totale_positivi"/("popolazione"/100000)`).

Save the new dataset naming it "covid19-ita-regioni-per-100k".

### 6. Reducing the Province Dataset

The dataset "dpc-covid19-ita-province" has some fields containing local codes and extra information which can be removed in case they are not used for further analysis. Click on the dataset on your Dremio home and remove the following columns: *stato*, *codice_regione*, *codice_provincia*, *note*, *codice_nuts_1*, *codice_nuts_2* and *codice_nuts_3*.

The dataset contains an extra province for each region, named "In fase di definizione/aggiornamento", used to track the data not yet assigned to a specific province. In order to exclude it from the result, select the first occurrence of the string "In fase di definizione/aggiornamento" you find in the column *denominazione_provincia* and click on **Exclude...** in the dropdown menu. Once on the editor, you can preview the dataset without the rows where `denominazione_provincia='In fase di definizione/aggiornamento'`. Click on **Apply** to confirm the transformation.

You may also find that the rows where `denominazione_provincia='Napoli'` have a null value in the field *sigla_provincia*. This means that Dremio has interpreted the string "NA", which is the abbreviation of Naples, as N/A. Fix this by selecting the first occurrence of "null" you find in the column *sigla_provincia* and clicking on the option **Replace...**. Once on the editor, click on the **Custom condition** methodin the top left hand corner and insert the following condition into the text area:

```
"denominazione_provincia"='Napoli' AND "sigla_provincia" IS NULL
```

Type "NA" in the **Replacement value** field and click on **Apply**. Finally save the new virtual dataset naming it "covid19-ita-province-reduced".

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial-dremio/reduce.png)

