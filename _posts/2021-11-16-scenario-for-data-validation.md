---
layout: single
title:  "Scenario for data validation"
date:   2021-11-16 17:00:00 +0200
categories: platform
author: alberto.carotti
---
This is a tutorial to create an environment for easy automation of a common use case: data is available at a given source and, for future processing, must be saved into a database. Before doing so, however, we want to ensure that its contents are valid and, in case they are not, send an e-mail instead.

## Table of contents

* [Introduction](#introduction)
* [Data and schema](#data-and-schema)
  * [Data](#data)
  * [Schema](#schema)
* [Requirements](#requirements)
* [Configuration](#configuration)
  * [MinIO](#minio)
  * [Database](#database)
  * [Validation framework backend](#validation-framework-backend)
  * [Nuclio](#nuclio)
  * [Apache NiFi](#apache-nifi)
* [Conclusion](#conclusion)
  
## Introduction

In a [previous post](https://scc-digitalhub.github.io/platform/validation-framework-tutorial/), we introduced the validation framework: a hub for validating data, storing results and statistics reports and inspecting such documents.

In this post, we will face a realistic scenario. The data consists in a tabular document distributed by the municipality, which lists the schedule for cleaning the city's streets. We will run validation on this file and, depending on the results, either proceed to save the data into a database, or send an e-mail alerting that the document is not valid.

Unlike the previous post, however, we will not manually write a script to run the validation: we will import a function to a serverless platform, so that validation can easily be run by just passing proper arguments to it.

For the data flow, a tool for automated data processing will be used, taking care of retrieving the data, calling the validation function and determining what action to take depending on the results.

When configuration of these tools will be complete, the same scenario will be easy to replicate for different documents by just changing the values of some parameters.

## Data and schema

### Data

Let's take a quick look at the data. The [direct link](https://www.comune.trento.it/content/download/1359298/12996829/file/2021-08_spazzamento_rev1_-_senza_vie_a_mano.csv) is the value we will pass to the data flow tool for download.

Here are the header and a couple records:

```csv
strada;desvia;percorso;lato;tratto;note;data pulizia;orario pulizia inizio;orario pulizia fine;divieto di sosta inizio;divieto di sosta fine;data posizionamento segnaletica;data prima pubblicazione;data aggiornamento
3030;PIAZZA RAFFAELLO SANZIO;8;entrambi;da incrocio  Via A. Manzoni ad inizio Via G.D. Romagnosi;;27/09/21;20.15;04.00;19.00;05.00;23/09/21;22/09/21;
120;VIA F. AMBROSI;8;entrambi;;;27/09/21;20.15;04.00;19.00;05.00;23/09/21;22/09/21;
30;VIA J. ACONCIO;8;entrambi;;;27/09/21;20.15;04.00;19.00;05.00;23/09/21;22/09/21;
```

In short, each record mentions a specific street and the date and time during which it will be cleaned, which involves restrictions on parking.

### Schema

We took a look at the data through a direct link, but [here](https://www.comune.trento.it/Aree-tematiche/Open-Data/Tipologie-di-dati/Tutti-gli-open-data/Pulizia-strade-e-relativi-divieti-di-sosta-autunno-2021) you can see that its fields are supposed to follow certain rules: some cannot be null, some must contain a date or time with a particular format and so on.

These constraints are expressed through a verbose description, which we need to convert into a JSON **schema** file, with a specific structure, for the validation process. The schema has been manually written and can be downloaded [here](https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2021-11-16-scenario-for-data-validation/resources/street_cleaning_schema.json).

Now that we know what the data is about and where to get it, and have a schema file ready, let's see what software we need.

## Requirements

You will need instances, either local or remote, of the following tools, but no familiarity with them is required. Some require specific versions: if you do not meet a version requirement, there may be a work-around to replace a missing feature, but you may need some knowledge of the software.
* [MinIO](https://min.io/): a cloud storage tool, compatible with S3 (if you prefer, you may use a S3 instance instead).
* [Nuclio](https://nuclio.io/), version 1.6.0 or later (for Python 3.8 support): this is the serverless software we will use to run the validation function.
* [Apache NiFi](https://nifi.apache.org/), version 1.10.0 or later (for parameters support; if not available, *variables* may be used): for data flow and automated processing.
* A database to store data into, in case it is valid. [PostgreSQL](https://www.postgresql.org/) is used in this example, but if it is easier for you, it can be a different one.
* [Validation framework backend](https://github.com/scc-digitalhub/validation-framework): optional, as it is only needed if you wish to store the validation documents.

Let's configure them for our scenario.

## Configuration

As some tools depend on others, we will configure them in the order they are needed.

### MinIO

<img align="right" width="200" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2021-11-16-scenario-for-data-validation/images/minio.png">

As MinIO is a cloud storage service, all you need to do is upload the schema file (provided in the [schema](#schema) section) to a bucket you have access to.

Access your MinIO instance, select the bucket on the left section, and drag and drop the schema file to the right section.

### Database
Just have a database available and a user with the rights to create tables.

This tutorial uses *PostgreSQL*, so the format of certain values will follow its needs, but they can be changed easily enough to fit other types of databases when needed.

### Validation framework backend
As mentioned earlier, this is optional, since it is only needed if you wish to store the validation documents.

In such case, you will need to know the address of your validation framework backend, as well as the credentials for authentication. It supports *OAuth2* and *Basic* authentication, so respectively, you either need the value of the token or a combination of user and password.

Each user is assigned to a number of projects, identified by an ID. Therefore, you also need to know the project ID of one of the projects you have access rights for.

### Nuclio

Once you've accessed your Nuclio instance, create a *new project* (or use a pre-existing one), call it however you prefer and create a *new function*.

Then, click on **Import**, which allows you to import a YAML file that describes the function: a small *Import* button will now appear in the section below and, when clicked, will prompt you to select a file. Pass [this](https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2021-11-16-scenario-for-data-validation/resources/validate-data_nuclio_function.yaml) file to it, then click *Create*.

Both the function's code and configuration will be imported.

| Nuclio versions <1.6.0 |
| :------------------------------- |
|If the function's code is not being imported correctly, it is likely that your instance of Nuclio does not support the function's declared `runtime`, which is `3.8` (whose support was introduced together with *3.7*). You may try to work around it by updating the YAML file before importing, changing its `runtime` value to `3.6` or whichever value your instance accepts. The code will be imported, but since *Python 3.7+* is needed for it to work, you will also need to update the function's configuration, under *Build > Image name*, providing a Docker image that supports it.|

Regardless, you also need to move to the *Configuration* tab and scroll until you see the *Environment Variables* section and update their values (they may appear in a different order):
* `DATA_STORE_CONFIG_ENDPOINT_URL`: Address of MinIO instance
* `DATA_STORE_CONFIG_AWS_ACCESS_KEY_ID`: MinIO access key ID
* `DATA_STORE_CONFIG_AWS_SECRET_ACCESS_KEY`: MinIO access secret
* `DATA_STORE_CONFIG_REGION_NAME`: Data store region name
* `DATA_STORE_URI`: S3-format path to the MinIO bucket; this is a default value and may be overridden when invoking the function

The following variables are used for storing the documents through the validation framework backend:
* `METADATA_STORE_URI`: Address of the validation framework backend.
* `METADATA_STORE_CONFIG_AUTH`: The method of authentication you wish to use, either `oauth` or `basic`
* `METADATA_STORE_CONFIG_TOKEN`: For `oauth`; value of the token
* `METADATA_STORE_CONFIG_BASIC_USER`: For `basic`; username
* `METADATA_STORE_CONFIG_BASIC_PASSWORD`: For `basic`; password
* `PROJECT_ID`: ID of a project you have access rights for

Once you're done, click **Deploy** in the upper right; it may take a few minutes, but it should be successful.

Nuclio configuration is complete. The function you have generated is triggered by a *POST* request, whose body will describe what file to validate. The function will then execute validation by using the validation framework's *Datajudge* Python library and return the results. If the backend instance is also configured and linked properly, it will store related documents as well through it.

The function's address is displayed in the *Code* tab, on the right section and is a value you will need to configure in *Apache NiFi*. It may look similar to `https://localhost:54671`, but if your Nuclio instance is remote, you may need to contact its administrator to know the path to your function.

The function is called through a *POST* request, and its body should use the following *JSON* format:
```json
{
    "experimentId": "experiment_id",
    "resourcePathUri": "file_to_validate",
    "resourceSchemaUri": "schema_file",
    "resourceName": "resource_name",
    "dataStoreUri": "s3_format_path_to_bucket"
}
```
As mentioned before, the `dataStoreUri` field, if present in the body, overrides the default value the environment variable contains.

The `experimentId` field is also optional: since it is needed for the validation framework backend, documents will not be stored if omitted.

Alternatively, instead of a *JSON* body, a simple *plain text* body may be provided, containing the name of the file (for example, `street_cleaning.csv`). In this case, the function only checks if it is a valid CSV file.

### Apache NiFi
Access your NiFi instance, expand the *Operate* menu on the left, and click the *Upload Template* button. Provide the pop-up with [this](https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2021-11-16-scenario-for-data-validation/resources/validation_scenario_nifi_template.xml) file.

Now that the template has been imported, you need to generate a flow with it. Drag the *Template* icon from the top toolbar to the square-patterned area and select the template you just imported (`validation-scenario`).

<img align="right" width="200" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2021-11-16-scenario-for-data-validation/images/main_pg.png">

A rectangle will appear, bearing the name *"Validation scenario"*. This is a *process group*: you may think of it as a container for data flows.

Double-click it to enter it and you will see a number of white rectangles, connected to one another: these are called *processors* and each of them performs an operation. The whole graph is called *flow* and describes a sequence of operations to execute on data.

<img align="right" width="400" src="https://raw.githubusercontent.com/scc-digitalhub/scc-digitalhub.github.io/master/assets/posts/2021-11-16-scenario-for-data-validation/images/full_flow.png">

Even without prior experience with the tool, you can read the *processors*' names and get an idea of what their tasks are: the **first** one, in the top left, will generate the database tables to store the data, in case it is valid. The **second** one downloads the file we talked about earlier, while the **third** one uploads it to MinIO.

After a number of other processors (among which is one that calls the Nuclio function we imported earlier), the flow ends with a fork, sending an e-mail if the data is invalid, or otherwise storing it into the database.

Understanding the NiFi flow completely is not necessary, but while importing a template allows to replicate a data flow instantly, some values still need to be configured. In the top left, next to the first processor, is a yellow rectangle, which is simply an annotation, listing all **parameters** that need to be set.

| Apache NiFi versions <1.10.0 |
| :------------------------------------- |
|Parameters were introduced in NiFi with version 1.10.0, to replace *variables* (although variables are still supported for backwards compatibility). With earlier versions, you can use variables instead.|

Right click in the square-patterned area (outside of any element) and click **Configure**. In the *General* tab, under *Process Group Parameter Context*, select *Create new parameter context*.

In the pop-up that appears, enter any *Name* you'd like in the *Settings* tab, then move to the *Parameters* tab. Here, you will need to add (by clicking on the **+** symbol) each parameter, along with its value:
* `emailRecipient`: The recipient of the e-mail sent in case the data is not valid.
* `experimentId`: The ID of the experiment you wish to use, if you want documents to be stored through the validation framework backend.
* `fileToValidate`: Address to download the file to validate: `https://www.comune.trento.it/content/download/1359298/12996829/file/2021-08_spazzamento_rev1_-_senza_vie_a_mano.csv`
* `minioAccessId` (**sensitive** value): MinIO access key ID
* `minioAccessSecret` (**sensitive** value): MinIO access secret
* `minioBucket`: Name of the bucket where the file will be moved to once it is downloaded
* `minioUrl`: Address to MinIO instance
* `nuclioFunctionAddress`: Address to the Nuclio function you generated
* `resourceName`: Any name you wish to use, purely for readability. For example: `Street Cleaning`.
* `resourcePathUri`: Name you wish to give to the file, once stored to MinIO. For example: `street_cleaning.csv`.
* `resourceSchemaUri`: Name of the schema file you manually imported to MinIO: `street_cleaning_schema.json`.
* `smtpHost`: SMTP service to use for sending an e-mail when data is not valid. If using *Google Mail*, the value is `smtp.gmail.com`.
* `smtpPassword` (**sensitive** value): Password of the SMTP account to use to send the e-mail.
* `smtpUsername`: Username of the SMTP account to use to send the e-mail.
* `tableName`: The name of the database table you wish to store data into, in case it is valid. For example: `street_cleaning`

Once you're done, click **Apply** for all pop-ups until you return to the flow.

Right-click again in the square-patterned area, pick *Configure* and switch to the *Controller services* tab. Listed are two controller services to configure.

The **CSVReader**-type service is ready and just needs to be enabled: click on the lightning icon and click *Enable*.

For the **DBCPConnectionPool**-type service you need to change some values; click the gear icon and switch to *Properties*:
* `Database Connection URL`: The format of this string depends on the type of your database. For PostgreSQL, it's `jdbc:postgresql://database_address/database_name`
* `Database Driver Class Name`: This also depends on the type of database. For PostgreSQL, it's `org.postgresql.Driver`
* `Database Driver Location(s)`: This also depends on the type of database. For PostgreSQL, enter this address as value: `https://jdbc.postgresql.org/download/postgresql-42.2.7.jar`
* `Database User`: Username for authentication
* `Password`: Password for authentication

When you're done, click *Apply* and enable this controller service as well, then close the pop-up to return to the flow.

Finally, we must configure some processors. For security reasons, templates do not save values for *sensitive* properties, so we must fill them manually by referencing the parameters we earlier defined as **sensitive** values.

The following is a list of each processor and properties you need to update:
* `Store on MinIO`: `Access Key ID` with `#{minioAccessId}` and `Secret Access Key` with `#{minioAccessSecret}`
* `Send e-mail`: `SMTP Password` with `#{smtpPassword}`

Depending on the SMTP service, you may need to access the SMTP service itself to allow other applications to use the account for sending e-mails.

The flow is finally ready to be executed. Right click in the square-patterned area and click `Start`. All processors will start running. As the file is very small, it should only take a few moments. In the top left of NiFi's UI you can view how many processors are currently executing their task, as well as how much data is currently being handled.

If there are no other flows running in your NiFi instance, these numbers should drop to zero once execution is done.

Once execution is done, stop all processors by right-clicking in the square-patterned area and clicking `Stop`. If left running, the root processor is configured to repeat execution after `1 day`, which you likely don't need.

The file is actually valid, so you should expect the database to now contain a table that has been filled with the file's contents. If you want, you can change the schema file so that the file will be considered invalid (for example, by removing an entry from the list of accepted values for the field `lato`), to check if the e-mail is being sent correctly.

If you wish to run the flow again, simply right-click in the square-patterned area and click `Start`: it will start immediately, but remember to stop them again when done.

## Conclusion

In this post we configured several tools to automate the task of validating a file and performing an action depending on the results.

If you wish to validate a different file, remember to:
* Create a **new schema file** and upload it to MinIO
* Update the `fileToValidate`, `resourceName`, `resourcePathUri`, `resourceSchemaUri` and `tableName` parameters on NiFi
* Update the ***Create table* processor** on NiFi with a new SQL query to create a fitting table. You may need to change the *Record Reader* in the *Put into DB* processor too.
