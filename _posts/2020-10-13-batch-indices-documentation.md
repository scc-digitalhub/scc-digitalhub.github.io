AZURE BATCH - Project inDICEs
=============================

InDICEs is a research project that aims to empower policy-makers and
decision-makers in the Cultural and Creative Industries to fully
understand the social and economic impact of digitisation in their
sectors and address the need for innovative (re)use of cultural
assets.^[[1]]

The project is data driven. Two FBK groups participate, SCC Lab and
CoMuNe Lab. SCC Lab is involved as a technical partner for the
collection and processing of data, while CoMuNe takes care of the
research and analysis phase.

Project partners showed interest in various data sources, in particular
Wikipedia.

The following sections describe:

1.  The pipeline implemented for Wikipedia data collection
2.  The raw data processing phase
3.  Azure Batch usage for the project

### 1. Pipeline

#### Datasource

There are many Wikipedia datasets. They are periodically loaded on the
Wikidump portal^[[2]] and their contents are various. We needed
a specific dataset, in particular we wanted a snapshot of Wikipedia,
which means the current state of all the pages (in respect of a specific
language project, like the english or the spanish one) including all the
links between pages, and the complete list of revision (also called
edits) made by users through time. For reference, we’ll call the dataset
which contains all the pages (texts, hyperlinks, citations and so on)
and all the revisions made by users (both humans and bots) Dump Dataset.

The Dump Dataset consists of a variable number of compressed (gzip or
7z) XML files, produced by Wikipedia at the beginning of every month and
made available on their portal or through hosted mirrors. There is a
Dump Dataset for every Wikipedia language project.

| Dump dataset             | Size Compressed (GB)     | Estimated Size Exploded (GB) |
| ------------------------ | ------------------------ | ---------------------------- |
| Enwiki                   | 172                      | 17200                        |
| Eswiki                   | 20                       | 2000                         |
| Itwiki                   | 18                       | 1800                         |

Tab.1 Dataset collected and their size

For the purpose of the project, we collected three Dump Datasets:
italian, spanish and english.

#### Data collection

In order to collect the data we have developed a script which downloads
the dump files from the Wikidump portal. The Italian and Spanish data
were stored initially on a dedicated VM, then, after the processing,
they were manually uploaded to the data lake storage with Azcopy, a
package designed to interact with the Azure Storage via CLI.

For the English Wikipedia, we modified the script to stream the data
directly into the storage.

![alt text](https://user-images.githubusercontent.com/47110912/95854886-df069b00-0d57-11eb-8e1a-88608037ad3c.png)

  Fig 1. Data gathering pipeline

### 2. Processing

Once we collected the data, we needed to process them, because the raw
XML files were not suitable for the analysis task and, most of all, they
didn’t contain the refined graph’s link we wanted.

In 2018 was published the paper “WikilinkGraphs: A Complete,
Longitudinal and Multi-Language Dataset of the Wikipedia Link
Networks”^[[3]], written by Consonni et al, which described the
precise process to extract the information we wanted from the Dump
Dataset. The authors also published on a repository the code they used
to process the data.^[[4]] Since the project has been made open
source, we decided to adopt the scripts the researchers used.

The process to extract and refine the data is the following:


1.  Three intermediate datasets are extracted from the raw Dump Dataset
    1.  Revisionlist: list of all the revision made by users
    2.  Raw Wikilinks: list of all links between pages
    3.  Redirects: list of pages that redirect to others (es.: NY
        Redirects to New York)


2.  Snapshot phase:
    1.  The Revisionlist dataset is snapshotted for every year and produce
        the Snapshots dataset
    2.  The Raw Wikilinks is also snapshotted and produce the Raw
        Wikilinks Snapshots dataset
    3.  The Redirects are resolved (in a sort of deduplication of the links)


3.  The last phase is the extraction of the Wikilinks Graph from the Raw
    Wikilinks Snapshots and the Resolved Redirects.

![alt text](https://user-images.githubusercontent.com/47110912/95851943-466e1c00-0d53-11eb-8144-16a5f46393c8.png)

  Fig 2. The processing workflow

The process posed two challenges:

1.  Which storage to use for the data?
2.  On which platform to run the processing scripts?

Regarding the first issue, we decided to adopt the Azure object
storage because:

-   Offers unlimited storage
-   It is object based
-   Cost-effective

As for the second question, we initially chose to use a dedicated VM,
mainly because it gave us access to a shell as required by the script
structure.

Dedicated Azure VM Specs:

-   Name: D8s Standard v3
-   CPUs: 8 virtual CPUs (Intel (R) Xeon (R) Platinum 8171M CPU @
    2.60GHz)
-   RAM: 32GB
-   Storage: 500 GB SSD
-   Price per hour: 0,4048 €/h

The "legacy" approach with VM has proved to be effective for the Italian
and Spanish wikis, given the relatively small size of the two. It was
also a valid option for part of the English wiki’s processing,
specifically for the Revisionlist and Redirects part.

Instead, for Raw Wikilinks and Raw Wikilinks Snapshots datasets, another
solution was required.

| Dataset processed                | Processing time on turned on VM (hours) | Processing time from stats files (hours) |
| -------------------------------- | --------------------------------------- | ---------------------------------------- |
| Itwiki                           | 80                                      | 483                                      |
| Eswiki                           | 100                                     | 625                                      |
| Enwiki (without Wikilinks steps) | 100                                     | 448                                      |
| **Total**                        | 280                                     | 1556                                     |

Tab 2. Datasets processing time on VM on 7 parallel running processes

#### Problem of long-time processing on a single VM

The English dataset consists of 685 dump files to be processed, for a
grand total of 172 GB (17,2 TB uncompressed). The first step, that of
extracting the Raw Wikilinks, requires an input dump file and produces
an output file (Raw Wikilinks). The second step, that of extracting the
Raw Wikilinks Snapshots, requires 2 input files (Snapshots + Raw
Wikilinks) and produces an output file (Raw Wikilinks Snapshots). This
second step must be done 20 times, once for every year from 2001 to
2020.

We estimated the time it would take to process the English Wikipedia
files on a single machine. To make these predictions we took as baseline
the time taken by the VM to process Itwiki and Eswiki and scaled the
estimation to account for the larger input size. The time estimate for
the two processes was as follows: about 1100 hours for the first step,
about 3300 hours for the second. Therefore 4400 hours distributed on 7
parallel processes, (workload limit for the VM used) leads to the
prediction of about 26 days of work.

As these times were considered not acceptable, it was decided to test
the Batch service.

### 3. Azure Batch

Azure Batch is a massively scalable compute platform that allows for
large-scale parallel batch workloads to be run in the cloud.

#### Preparation

With the Batch platform we wanted to distribute the processing workload
over multiple VMs. We had to adapt some parts of the code to the
distributed execution. We wrote the code to manage the creation of the
VMs’s pool and the scripts to generate the job. We have also set up the
tools to monitor the progress and execution of the various tasks.

We have distributed the processing into independent tasks, each
dedicated to a single input / output operation. Furthermore we had to
define and configure the execution environment for the batch script: we
installed the dependencies on each VM, retrieved the processing
libraries from the Github repository, downloaded the files to be
processed on the VMs (one file per machine at a time) from the Azure
storage and instrumented the scripts to upload the results to the cloud.

#### Tests

In carrying out the Raw Wikilinks extraction and the Raw Wikilinks
Snapshots generation, we made several experiments: the variables taken
into consideration are the number of VM in the pool and the number of
files to process.

Specifically, these were the test configurations:

1.  For the first step (from Dump Dataset to Raw Wikilinks):

    1.  100 VM for 685 input files (685 total tasks)

2.  For the second step (from Raw Wikilinks to Raw Wikilinks Snapshots):

    1.  200 VM for 285 files (5700 total tasks)
    2.  75 VM for 300 files (6000 total tasks)
    3.  10 VM for 100 files (2000 total tasks)

In the first case we tried to test how the service works with a
considerable number of VM in the pool. The second is a more generic
situation, with a medium size pool and a great number of tasks. In the
third case we wanted to check how reliable is the usage of low priority
VM on a long time run.

We used the same machine model for all the tests:

-   Name: Standard D2 v3
-   Typology: Low priority
-   CPUs: 2 vCPU in Hyper Threading (various CPUs models)
-   RAM: 8 GB RAM
-   Storage: 50 GB SSD
-   Hourly usage cost: 0,0203 €/h

#### Results

The first result is that the batch processing produced the expected
dataset without errors. Regarding the performances, in none of the tests
was a VM seized. In the sample with a pool of 200 VM we found 4 startup
problems, 3 network problems (probably due to the high number of
requests coming from the same group of IPs directed to github or pypi)
and one unspecified. All four problems were resolved with a reboot of
the nodes.

With the use of Batch, we spared a lot of resources, both in terms of
time and money.

| Dataset                   | Execution time from stats file (hours) | Pools uptime (hours) | N° VMs | N° files | N° tasks | Cost (€) |
| ------------------------- | -------------------------------------- | -------------------- | ------ | -------- | -------- | -------- |
| Raw Wikilinks             | 573                                    | 8                    | 100    | 685      | 685      | 17       |
| Raw Wikilinks Snapshots A | 1594                                   | 6                    | 200    | 285      | 5700     | 24       |
| Raw Wikilinks Snapshots B |                                        | 12                   | 75     | 300      | 6000     | 19       |
| Raw Wikilinks Snapshots C |                                        | 15                   | 10     | 100      | 2000     | 3        |
| **Total**                 | 2167                                   |                      |        |          |          | 63       |

Tab 3. Execution times and costs of the various tests

By processing the dumps of three different Wikipedia, we obtained many
datasets. In addition to the list of edits made by users (corresponding
to the Revisionlist dataset) and the graph of the links between the
pages (Wikilinks Graph), we have decided to store the other intermediate
datasets as well. The following table shows the final dimensions of the
various datasets produced during the processing for the three languages
(Italian, English and Spanish).

| Dataset                 | Enwiki             | Eswiki             | Itwiki             |
| ----------------------- | ------------------ | ------------------ | ------------------ |
| Raw Wikilinks           | 746                | 111                | 92                 |
| Raw Wikilinks Snapshots | 36                 | 8                  | 9                  |
| Redirects               | 0                  | 0                  | 0                  |
| Resolved Redirects      | 4                  | 1                  | 1                  |
| Revisionlist            | 62                 | 9                  | 8                  |
| Snapshots               | 42                 | 8                  | 6                  |
| Wikilinks Graph         | 21                 | 4                  | 4                  |
| **Total**               | 911                | 141                | 120                |

Tab 4. Final output datasets dimension (compressed GB)


#### Task failure handling

The Batch service leaves to the user the management of failures. A task
can fail in various ways. For example due to a program error or a
service error. Some examples of service errors can be the following:

-   if you use a VM low priority, this can be requisitioned by Azure if
    the resources allocated to it are required elsewhere;
-   since a set of VM in a pool can share the same public IP, it is
    possible for service providers to deny the connection when a large
    number of VM make requests to the same service provider;
-   the allowed number of available resources is reached;

In the case of the dump processing, the tasks were practically all
independent of each other. The dependencies were at the file level,
meaning that a portion of the input dataset was required to produce a
refined output dataset. In other words, the tasks did not require the
presence of the complete input dataset to be executed.

At the end of each task two files were produced: one consisting of a
certain portion of the dataset (Raw Wikilinks, Redirects, etc.) and the
other a statistics file. If the task was successful, the two files were
uploaded to the storage. The task failure control system adopted is
naive but effective. If the script, for some reason, failed, it would
not produce files, causing the upload phase to fail. This way we could
notice the lack of a part of the dataset by making a final check on the
presence of output files within the storage.

#### Human intervention and monitoring

The processing was not fully automated. Parts of the work were performed
by hand. The process of studying the code and re-adapting it to our
needs took a fair amount of time. Fortunately the script structure (bash
\+ python) suited the Batch platform quite well. The possibility of
splitting the processing into atomic tasks (1 input file 1 output file)
made it possible to facilitate the adaptation of the “legacy code”.

In general, the monitoring took place in two ways. On the one hand we
used the statistics files that the scripts produced, containing
information regarding the number of pages parsed, the number of
revisions analyzed, the time taken etc.; on the other hand, the Batch
Explorer client was widely used. With this tool it was possible to
manually scale the size of the VM pool to avoid having a series of
machines in idling and thus contain the expenses. It was also possible
to monitor the general progress of the tasks, identify any problems and
manually intervene to resolve them.

#### Costs

As we mentioned in the test results section, adopting the Batch service
has saved us not only time, but also money.

We were able to save more than 70% on the estimated cost projection. We
based the cost prediction on two elements: the execution of the work on
the VM used to process the Italian and Spanish Wikipedia and the
expected execution time on the single VM (i.e. the 4400 hours of
execution mentioned above)

| Dataset (US)            | VM Time (h)  | Batch Time (h)  | Saved Time (€) | VM Cost (€) | Batch Cost (€) | Saved Cost |
| ----------------------- | ------------ | --------------- | -------------- | ----------- | -------------- | ---------- |
| Raw Wikilinks           | 1100         | 573             | 48%            | 64          | 17             | 73%        |
| Raw Wikilinks Snapshots | 3300         | 1594            | 52%            | 190         | 46             | 76%        |


Tab 5. Confrontation with estimated times and costs on a single VM and
on Batch Service.


### 4. Conclusions

Using Azure Batch for the project was the key to save money and time.
Given the size of the WIKI datasets, the traditional approach with plain
VM would not have led to optimal results. Although it was designed for
another execution environment, it was possible to adapt the “legacy”
code to the new tool. It took some time, however, the experience
accumulated in learning how the tool works has come in handy. In fact,
we have already successfully adopted the Batch platform in another
project. Despite the inherent limitations of the platform, the
cost-effectiveness and scalability make Azure Batch a great tool for
large parallel workloads.

* * * * *

[[1]](#ftnt_ref1) [https://indices-culture.eu/about/](https://www.google.com/url?q=https://indices-culture.eu/about/&sa=D&ust=1602581845434000&usg=AOvVaw21Euhhgk5yLeqUatL41b_-)

[[2]](#ftnt_ref2) [https://dumps.wikimedia.org/](https://www.google.com/url?q=https://dumps.wikimedia.org/&sa=D&ust=1602581845434000&usg=AOvVaw1XpNMD_5YZF8gBmIBMWknF)

[[3]](#ftnt_ref3) [https://arxiv.org/pdf/1902.04298.pdf](https://www.google.com/url?q=https://arxiv.org/pdf/1902.04298.pdf&sa=D&ust=1602581845434000&usg=AOvVaw1DQhpe9pnWBW8KPI2_lq7T)

[[4]](#ftnt_ref4) [https://github.com/WikiLinkGraphs](https://www.google.com/url?q=https://github.com/WikiLinkGraphs&sa=D&ust=1602581845435000&usg=AOvVaw3AyFaaDrwAISqtJKcubEz3)
