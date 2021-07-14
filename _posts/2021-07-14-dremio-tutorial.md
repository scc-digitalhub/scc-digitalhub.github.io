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

### 3. Adapting the Census Dataset

Some regions are named differently in the dataset "censimento-2011" than they are in the Civil Protection Department datasets. Prior to joining them, they must match with each other. On your Dremio home, click on "censimento-2011" to open it, highlight the first occurrence of the string "Friuli-Venezia Giulia" in the column *Regione* and select **Replace...** from the dropdown menu that will appear. In the editor you can replace the highlighted string with a new value throughout the whole *Regione* column (Dremio will actually create a new column named "Regione" and remove the old one). Fill the **Replacement value** field with the string `Friuli Venezia Giulia` and click on **Apply**. Follow the same procedure to replace the value "Bolzano/Bozen" with "P.A. Bolzano" and "Trento" with "P.A. Trento".

![alt text](https://raw.githubusercontent.com/etomaselli/hello-world/master/tutorial-dremio/censimento.png)

If you see the icon "Abc" before *Femmine*, *Maschi* and *Totale* column names, it means Dremio has interpreted their values as text. Click on the icon, select **Integer...** and click on **Apply** to convert them to numbers. Then click on **Save as...** in the upper right hand corner, name the new virtual dataset "censimento-2011-conformed" and save it in your home.


