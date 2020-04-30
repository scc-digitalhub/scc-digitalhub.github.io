---
layout: single
title:  "Apache NiFi - What it is and how to use it"
date:   2020-04-30 15:40:00 +0200
categories: platform
author: alberto.carotti
---
This article provides a guide for beginners to Apache NiFi, explaining what the software is about and guiding the user through its basic features and interface.

If you would like to jump straight to a tutorial on how to use NiFi for a real use case, you can do it [here](https://scc-digitalhub.github.io/platform/nifi-tutorial-gtfs/).

## Table of contents

* [Introduction](#introduction)
  * [What is NiFi for?](#what-is-nifi-for)
  * [What is working with NiFi like?](#what-is-working-with-nifi-like)
* [Using NiFi](#using-nifi)
  * [Main UI](#main-ui)
  * [Parameters and variables](#parameters-and-variables)
  * [Configuring a processor](#configuring-a-processor)
  * [Connecting processors through a relationship](#connecting-processors-through-a-relationship)
  * [Inspecting flowfiles](#inspecting-flowfiles)
* [Conclusions](#conclusions)

## Introduction

### What is NiFi for?

*Apache NiFi* is a tool to process large amounts of data in an automated and scalable way, by building a chain of operations to apply on such data, modifying and adapting it depending on its contents.

<img align="right" width="400" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/role.png">

Here are some sample use cases:
- Execute different operations on data based on contents.
-	Periodically process new data to extract useful information and start processes that use the results.
- Adapt data coming from different sources, with the same contents but in different formats, to the same schema.

### What is working with NiFi like?

The NiFi user builds a ***flow***, which consists in a sequence of operations data is subject to.

The *flow* is built by adding ***processors*** and connecting them together. Each *processor* performs a specific operation, depending on its type.

Among many others, there are processors designed to:
-	Perform an HTTP request (for example to download a file or perform an API call)
-	Convert a file from one type to another
-	Execute a query on a database
-	Decide what path to route data to, depending on the contents

When a processor is added, some configuration is necessary: a processor that executes a query on a database will need to know what database to connect to and the credentials to use.

<img align="right" width="400" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/flow.png">

The image on the side illustrates an abstraction of a flow to download data from a URL and save it as a *Comma-Separated Values* (*CSV*) file.

Each rectangle is a **processor** and each arrow connects a pair of processors through a **relationship**, deciding which path data should follow depending on the results of the processor’s operation.

It is possible to decide what to do when an operation fails (invalid address, file cannot be converted into CSV, etc.), but this has been omitted from the example for the sake of simplicity.

## Using NiFi

This section explains NiFi’s UI and guides you through its main features. **You do not need to worry about saving your work while working with NiFi**: every action you perform will automatically save the current state of the entire flow.

Images come from version 1.11 of NiFi. Previous versions may have slight differences, but they will not affect the features described here, except for the [Parameters and variables](#parameters-and-variables) section, which will explain how to handle differences.

### Main UI

The main screen displays a large, square-patterned area, which is where processors will be placed.

<img align="right" width="400" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/ui.png">

**On the top are two toolbars**: the one above is to add elements to the flow, while the lower one gives an overview of the flow’s status.

**On the left are two small menus**: *Navigate* offers a navigable map of the flow; *Operate* contains buttons to change the state of processors, plus some additional features.

*Navigate* and *Operate* may be reduced by clicking on <img width="20" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/min.png">, as most actions they involve may be performed by interacting directly on the flow.

Add a ***process group*** by dragging the <img width="25" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/ui_pg.png"> icon to the square-patterned area, input “*A quick flow test*” as name and click *ADD*.

For the sake of this guide, **process groups** may be considered equivalent to directories in your computer: just like you wouldn’t want to clutter your *home* directory with loads of unrelated files, you’d rather organize your flows in NiFi with a similar tree-like structure, made of *process groups*.

<img align="left" width="200" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/process_group.png">

A rectangle will appear on the flow, with the name you chose and some numbers that will indicate the status of processors within.

**Enter the process group by double-clicking it**.

<img align="right" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/path.png">

The flow will appear empty again, but you can see that the path at the bottom has changed.

Before adding any processors, let’s add some ***parameters* or *variables***, which are useful for any value that may need to be used multiple times in your flow.

### Parameters and variables

There are some values that you may need multiple times in your flow, like the **root address of a server** that offers API end-points that you need to send requests to, or the **name of a database schema** that contains tables you need to interact with.

If a value needs to be updated, you would rather change it in only 1 place, instead of searching for all processors that use it.

**Parameters/variables serve this purpose and they are very similar**: this redundancy is because parameters were added later (version *1.10*) to include new features that required a different design.

The current version of NiFi supports both parameters and variables, but **variables may be dropped** at some point.

This section explains how to use both parameters and variables, but, if possible, it’s recommended to use parameters.

The only difference important for this tutorial is:
-	**A variable is assigned to a process group** and can be used by that process group and all its sub-process groups.
-	**Parameters are grouped into *parameter contexts***, which are essentially lists of parameters. **A parameter context is independent of process groups**, so it may be assigned to different, unrelated process groups. However, a process group may only have access to 1 parameter context: sub-process groups cannot see the parameters of their parent process group, unless the same context is explicitly assigned to them.

Let’s add a parameter/variable containing the name of some food you like. There is no need to add both a parameter and a variable, so only add a variable if your version does not support parameters (versions < *1.10*).

#### Adding a parameter

<img align="right" width="150" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/pc_settings.png">

Click on the menu button in the top right (<img width="25" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/button_menu.png">) and select “*Parameter Contexts*”. Click on <img width="20" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/button_plus.png"> in the top right to start adding a new parameter context.

In the *SETTINGS* tab, pick a name for the context (description is optional), then switch to the *PARAMETERS* tab and click on the <img width="20" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/button_plus.png"> button there.

<img align="left" width="240" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/pc_add_param.png">

*Name* will be how you refer to this parameter, while the important field is *Value*, which is the value NiFi will use whenever it encounters this parameter.

*Sensitive Value* is for things like passwords, to avoid displaying them as plain text.

Click *APPLY* to add the parameter, then click *APPLY* again to complete the creation of the parameter context.

The new context will now be listed in the *NiFi Parameter Contexts* menu, which you may close with <img width="20" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/button_x.png">.

<img align="right" width="200" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/pg_general.png">

Finally, assign the parameter context to the current process group: right click in the square-patterned area and click *Configure*.

In the *GENERAL* tab, select the context you created under the “*Process Group Parameter Context*” option and click *APPLY*.

You are now ready to add a processor that uses this parameter. You can skip [Adding a variable](#adding-a-variable), as it is equivalent to what you just did.

#### Adding a variable

Right-click on the square-patterned area and click *Variables*. Click <img width="20" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/button_plus.png"> in the menu that appears to start adding a new variable.

<img align="right" width="400" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/menu_variables.png">

Input the *Variable Name*, which is how you will refer to this variable, click *OK*, then input its value, which is the value NiFi will use whenever it encounters this variable, and click *OK*.

Click *APPLY* to finish adding variables.

You are now ready to add a processor that uses this variable.

### Configuring a processor

We will add and configure a processor that simply generates a ***flowfile*** containing some text. "**Flowfile**" is the name of data as it travels through the flow: it will not be saved on your computer, since we won’t add any processors to store it.

<img align="right" width="360" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/menu_add_proc.png">

The type of this processor is called *GenerateFlowFile*: it is generally useful for testing or hard-coding some values.

Drag the <img width="25" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/ui_proc.png"> icon into the square-patterned area to trigger the *Add Processor* prompt.

Since we already know the name of the processor, we can type it as filter.

When you’re looking for a certain feature, but do not know the type’s name, you can try filtering by tag, like “*json*” or “*database*”.

The tag system is, unfortunately, not completely functional: **don’t type more than 1 tag**, or it may not list processors even if they do contain all the tags you listed, just because it expected them in a different order.

<img align="right" width="230" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/ui_proc_on_flow.png">

Double-click the desired type and the processor will appear in the square-patterned area. Double-click it to configure it.

There are 4 tabs: *SETTINGS*, *SCHEDULING*, *PROPERTIES* and *COMMENTS*. These 4 tabs are present no matter the type of the processor, but the contents of the *PROPERTIES* tab may vary significantly.

#### SETTINGS

<img align="right" width="280" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/settings_name.png">

The only value we will change is the ***Name***. This is just for our convenience: *Name* has no impact on any feature and different processors may have the same name.

#### SCHEDULING

The only value we will change here is ***Run Schedule***, which indicates how often the processor will execute its task.

<img align="right" width="330" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/scheduling_interval.png">

For a root processor, the default value `0 sec` means NiFi will attempt to execute this processor as often as possible.

We only need it to execute once, so change the value to `1 day`. This way, when, later, we will start the processor, it will execute immediately once and then wait 1 day before executing again (although we will stop it to prevent it from running again the day after).

This setting may seem harmless, but it is **very important: if the processor were to query a pay-per-use API, forgetting to set this value properly may cause thousands of useless queries that give the same result but cost a lot of money**.

#### PROPERTIES

We only need to change ***Custom Text***, which decides what the processor will write inside the flowfile it generates.

<img align="right" width="400" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/ui_proc_properties.png">

If you’re using version *1.10* or later of NiFi, then you probably configured a **parameter** named `favorite` during the [Parameters and variables](#parameters-and-variables) section of this document. With previous versions, it should be an equivalent **variable**.

Either way, the text to input here is very similar. For parameters:
```
I like #{favorite}.
```

For variables, just replace `#` with `$`:
```
I like ${favorite}
```

Click *OK* and then click *APPLY*. This processor will generate a flowfile that contains a statement, replacing the parameter/variable `favorite` with its value.

You will notice the processor still has the invalid symbol <img width="20" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/icon_invalid.png"> on it and, if you hover on it, it will tell you the *Relationship success* is invalid.

This is because we have yet to tell NiFi what to do with the generated flowfile. In the ***SETTINGS*** tab, you probably noticed the *Automatically Terminate Relationship* section on the right.

Any relationship with a tick sign there means “*when the result of the operation is <success/failure/etc.>, we don’t need the flowfile anymore and you can discard it*”.

However, we would like to send the generated flowfile to another processor, which will be added in the next section.

### Connecting processors through a relationship

We will add a second processor purely to demonstrate how to connect processors and how to inspect flowfiles, so we will not configure it.

Drag the <img width="25" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/ui_proc.png"> icon to the square patterned area and add a new processor. Since we will not configure it, its type doesn't matter, but let’s add a *LogAttribute* processor.

<img align="right" width="300" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/ui_rel.png">

Next, hover on the *GenerateFlowFile* processor you added earlier and a <img width="22" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/icon_rel.png"> icon will appear.

Drag it to the *LogAttribute* processor, which should glow green, and release it.

The *Create Connection* prompt will appear. Here you decide under which circumstances *GenerateFlowFile*’s output should become the input to *LogAttribute*.

Because NiFi does not expect *GenerateFlowFile* to ever fail, the only relationship available is ***success***, which is already selected.

A different processor type may have several relationships: *failure* is a common one, allowing you to route data differently when the task fails.

Click *ADD* to confirm the connection.

<img align="left" width="180" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/ui_simple_flow.png">

*GenerateFlowFile* is now valid, and the invalid symbol <img width="20" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/icon_invalid.png"> has been replaced by <img width="20" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/icon_stop.png">, signaling that the processor is now stopped, but ready to run.

You will notice a ***queue*** named *success* which contains flowfiles as they transit between the two processors.

The only remaining step is to start the processor and inspect the generated flowfile.

### Inspecting flowfiles

Right click on the *GenerateFlowFile* processor and click start. The status icon will change from <img width="20" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/icon_stop.png"> to <img width="20" src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/icon_run.png"> and it will immediately start its task.

NiFi’s graphical interface only updates at fixed intervals, so right click anywhere in the square-patterned area and click **Refresh** to see the current progress.

There is now 1 file in the queue between the two processors. *GenerateFlowFile* has generated the flowfile and is now waiting for the delay configured in the *Run Schedule* property of its *SCHEDULING* tab before generating a new one.

You can now stop *GenerateFlowFile* by right-clicking it and selecting *Stop*.

The flowfile in the queue is not being processed by *LogAttribute*, because this processor is invalid and hence stopped.

We will now **inspect the queue**. Right click on the queue between the two processors and select ***List queue***.

<img src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/ui_queue.png">

Click on <img src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/icon_view.png"> to view the flowfile's contents. A new tab will open, and you will see that the content of the flowfile is `I like pizza.` (or a different value, depending on what you set earlier).

If you see `I like .`, it means NiFi did not find any parameter/variable named `favorite`. Either it was not created, or incorrect syntax was used while configuring the processor’s *PROPERTIES* tab.

If you want to explore further on the topic of debugging, try clicking the <img src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/icon_info.png"> icon to view properties and attributes of the flowfile, or click <img src="https://raw.githubusercontent.com/alb-car/dh-posts-resources/master/nifi-beginner-guide/images/icon_prov.png"> to see its provenance.

Once you’re done inspecting the flowfile, close all prompts, right-click on the queue and select ***Empty queue*** to remove all queued flowfiles. This comes in handy when you’re just confirming the output of processors, but do not want to perform further operations on flowfiles.

Unfortunately, NiFi does not yet allow removing individual (instead of all) flowfiles from a queue, or inserting new ones manually, but **queues are very useful for debugging** and it’s common to stop processors to inspect flowfiles.

## Conclusions

We saw what NiFi can do, what it's like to work with it and explored its main features to understand how to use it. Next is [trying it on a real use case](https://scc-digitalhub.github.io/platform/nifi-tutorial-gtfs/)!
