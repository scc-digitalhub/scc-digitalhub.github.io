---
layout: single
title:  "Validation framework tutorial"
date:   2021-09-21 16:30:00 +0200
categories: platform
author: alberto.carotti
---
By combining the features of pre-existing validation and profiling libraries, as well as developing new software for additional purposes, we have created a platform to aid the whole process of data validation, from the initial step of acquiring the data, to archiving and inspecting the results.

This article teaches the reader how to use the tools involved.

## Table of contents

* [Introduction](#introduction)
  * [Scenario](#scenario)
  * [Structure](#structure)
* [Requirements](#requirements)
  * [Tools](#tools)
  * [Data](#data)
* [Usage](#usage)
  * [Datajudge](#datajudge)
  * [UI](#ui)
* [Conclusion](#conclusion)
  
## Introduction

This section describes the common scenario for data validation and provides a brief overview of the tools we will use.

### Scenario

Before processing data, we generally assume that *each record has a certain structure and certain properties hold true for its contents*.
For example, with tabular data, we expect entries to have a specific number of fields and each field to respect some rules: cannot be null, must be unique, must be a number, must follow a certain format...

Whether it's due to a bug, an unforeseen edge case, a conversion between formats, or something inserted by hand, it is not rare to have invalid values. When processed, these may halt execution, propagate errors, or generate misleading statistics.

Data validation aims to find these irregularities before they become problems. This means that, along with the data, another document, called *schema*, must be provided, listing what properties must be verified.

### Structure

The platform we have developed is built to combine aspects of data validation and profiling, offered by pre-existing libraries, together with new features for storing and presenting the results, to ease their inspection.

The data to be validated and its schema may come from several commonly used storage tools: *S3*, *Azure*, *FTP* servers...

We developed the following components. This post will focus on using Datajudge and the UI, as understanding the back-end is not necessary, but if you wish to learn more about the server side, feel free to read the documentation on the repository.
* **Datajudge**: a *Python* library which retrieves the data, combines the usage of pre-existing libraries for validation (currently supports [Frictionless](https://framework.frictionlessdata.io/)) and profiling (currently supports [pandas-profiling](https://github.com/pandas-profiling/pandas-profiling)) and generates a number of documents describing results, data and environment.
* **Back-end**: using a MongoDB instance for storage, it provides *Spring* REST APIs for CRUD operations on the generated documents.
* **UI**: developed with *React-Admin*, to inspect the documents.

## Requirements

### Tools

Each component is needed: either installed and configured locally, or through a remote instance.

* **Datajudge**, which requires **Python >= 3.7**.
* An instance of the **back-end**, as well as a **MongoDB** instance to store documents on.
* An instance of the **UI**.

An instance of [AAC](https://github.com/scc-digitalhub/AAC) is needed to act as identity provider for the components.

### Data

Obviously some data and its schema must be available, either locally or on the cloud. You can download [this sample data](https://github.com/alb-car/dh-posts-resources/blob/master/validation-tutorial/resources/companies_data.csv) and [its schema](https://github.com/alb-car/dh-posts-resources/blob/master/validation-tutorial/resources/companies_schema.json) to follow the tutorial.

Let's look at a few rows from `companies_data.csv`:
```
id,name,employees
1,Tech Srl,20
,Programming GmbH,29
3,Computers Inc,-10
```

We can see that the data is in *CSV* format and rows have `id`, `name` and `employees` columns.

Each column has different rules it must follow (and in several rows they are not doing so).
* `id` is an integer number, must not be null and must be unique.
* `name` is a string and must not be null.
* `employees` is an integer number and its value must at least be 1.

The schema file lists these rules. In the sample, it is written in [Frictionless Table Schema](https://specs.frictionlessdata.io/table-schema/#language) format, with a custom addition of an `errors` element within each column, used to distinguish properties of the errors, such as severity.

Let's inspect a portion of `companies_schema.json`:

```
{
    "fields": [
        {
            "name": "id",
            "description": "ID (1)",
            "type": "integer",
            "constraints": {
                "required": true,
                "unique": true
            },
            "errors": {
                "severity": 5
            }
        },
        ...
    ]
}
```

The `field` element is an array, listing objects that describe the columns:
* `name`: Name of the column.
* `description`: A readable description.
* `type`: The column's type.
* `constraints`: Various constraints, such as not-null (`required`), uniqueness (`unique`) or minimum value (`minimum`).
* `errors`: A custom addition, not part of the *Frictionless Table Schema* definition. It lists properties of any possible errors for this column, such as `severity`.

While `constraints` may seem like the only element that enforces checks on data, the library will also use `type` to ensure the column's type correctness and `name` to compare against the column's name within the data's header. The order of items within the `fields` object is also expected to match the order of columns within the data.

We are ready to validate this data against its schema and inspect the results.

## Usage

### Datajudge

*Datajudge* is a Python library and its usage involves creating a **data resource** that's linked to the data, creating a **client** that's linked to the metadata store (the back-end for storing validation documents), creating a **run** which specifies the validation library to use and finally commanding which documents the run should generate.

First, **import** Datajudge:
```
import datajudge as dj
```

Then, we instantiate a **data resource**. Since we want to validate data (and not just profile it), we provide the path to the data and the path to the schema. Although optional, we also give it a name.
```
data_resource = dj.DataResource(
        "path/to/companies_data.csv",
        schema="path/to/companies_schema.json",
        name="Companies"
)
```

Next is the **client**, which we link to the metadata store by entering its address and authentication for it. We also need a project ID we have rights for on the identity provider. In this example, the ID is `proj1`, but it may vary depending on the configuration of the identity provider you're using. Giving a name to the experiment is optional.
```
metadata_store_config = {
        "auth": "oauth",
        "token": "your_implicit_token"
    }

client = dj.Client(
        project_id="proj1",
        experiment_name="companies_exp",
        metadata_store_uri="backend_instance_address",
        metadata_store_config=metadata_store_config
)
```

Create a **run** and specify `frictionless` as the validation library to use. Choosing a run ID is optional.
```
run = client.create_run(data_resource, "frictionless", run_id="companies_run")
```

Finally, we determine which documents we want to produce. Usually, we want all of them:
```
with run:
    run.log_data_resource()
    run.log_short_report()
    run.log_short_schema()
    run.log_profile()
```
Respectively:
* A summary of the properties of the *data resource*
* A *report* on the results of validation, generated by the validation library
* The *inferred schema* based on the contents of input data, generated by the validation library
* A *profile* with statistics on the input data, generated by the profiling library

By running any of these methods, an additional document is also generated, describing the run's *environment*.

It's also possible to persist specific artifacts in a specific location. To keep it simple and see the results, let's do it for the full report, by adding a line within the run context:
```
with run:
    ...
    run.persist_full_report()
```
This example will create a local file, containing a verbose report, and save an additional, simple document in the metadata store.

A script performing all these operations is available [here](https://github.com/alb-car/dh-posts-resources/blob/master/validation-tutorial/resources/run_datajudge.py). The `config` *dict* contains all the values that will be passed as arguments to the methods, so before executing this script, you will have to update `config` to fit your needs.

All these metadata documents are stored by the back-end on the *MongoDB* instance it is configured to use. The back-end also provides end-points to serve these documents to the UI, which we will now use to view them.

### UI

Open the UI instance on your browser and, after logging in, you will be welcomed to the **Dashboard**. On the left is the navigation menu, which will expand as we travel through its tree-like structure.

<img width="600" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/validation-tutorial/images/dashboard.png">

Click on *Projects* and a **list of projects** will appear. Likely, it will only contain the one we used in the Datajudge section, as projects without any documents associated do not show up. You also can't see projects you do not have permissions for in the identity provider's configuration. Click on the *VIEW* button to the right.

You're now viewing the **project's overview** and the navigation menu has expanded. There is not much information here, so click on *Experiments*, either on the left or on the bottom.

You will now see a **list of experiments**. Unless someone else has been creating them on the same instance, it should only contain the `companies_exp` experiment we generated previously. Click on its *VIEW* button.

As expected, the **experiment's overview** appears, with little information. Click on *Runs*.

The **list of runs** is presented. Only `companies_run` should be present, so click on its *VIEW* button.

<img align="right" width="200" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/validation-tutorial/images/full_menu.png">

The **run's overview** is introduced and some summary information is presented, like the run's status or the libraries used. On the left, as well as on the bottom, you can access specific documents:
* *Artifact metadata*: This simple section lists the persisted files and their location.
* *Data profile*: Statistics on data and its fields.
* *Data resource*: A summary of the data resource.
* *Run environment*: The environment of the run execution, such as OS or RAM.
* *Short report*: The results of data validation and a list of errors found.
* *Short schema*: The schema inferred by the validation library, based on input data.

Each one contains rather self-explanatory information, so inspect them as you please.

If you wish to navigate backwards and view a different run, experiment or project, simply use the left menu.

If you're given a *NetworkError*, it's likely that you were disconnected due to inactivity as a safety measure. Simply reload the page and authenticate again.

## Conclusion
In this tutorial we focused on a simplified, but realistic, scenario. Given some data containing information on companies, we ran Datajudge on it, using its supported libraries for validation and profiling purposes, and generated several metadata documents, which were stored by the back-end and we viewed through the UI.

If you wish to know more about Datajudge's features, the structure of the back-end APIs, or in-depth details on installing and configuring the components, check out the documentation on the repository!
