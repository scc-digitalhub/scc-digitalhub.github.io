Azure Batch service
===================
Azure Batch is a massively scalable compute platform that allows for large-scale parallel batch workloads to be run in the cloud. It offers a cost efficient platform to execute tasks of various kinds, like ETL, data processing and machine learning.

### How it works

The typical workflow consists of creating a pool of Virtual Machines, executing some starting commands on every VM, and associating one or more jobs to the pool. Every VM in the pool is called a node.

A job consists of a collection of tasks that run in parallel. Also it manages the distribution of the tasks over the VMs and it appears it’s performed through a Round Robin algorithm. Multiple jobs can run concurrently on the same pool, if assigned to it.
A task is a unit of computation that is associated with a job. It runs on a node. Tasks are assigned to a node for execution, or are queued until a node becomes available. Put simply, a task runs one or more programs or scripts on a compute node to perform the work you need done.

![alt link](https://user-images.githubusercontent.com/47110912/95857331-bed8db00-0d5b-11eb-9533-ad9eb7b69d53.png)

Fig. 1 Batch Service schema

### Usage overview

1. Instantiate the VMs pool and define the compute job
2. Define the environment
3. Execution, interaction with the service, monitoring
4. Failure handling  When it comes to instantiate the pool, some parameters must be defined.

First you define the size of the pool, i.e. the number of nodes that will be requested. You then decide the type of machines you want to use, i.e. dedicated or low priority VMs. The dedicated VMs are reserved by Azure for the user who requests them. Low priority VMs derive from Azure's computational surplus. Another difference between the two is found in terms of price for hourly use. On average, a low priority VM costs ⅓ or ⅕ compared to a dedicated machine. The tradeoff of the low priority VM is that there may not be sufficient surplus resources to allocate to the user who requests them or the possibility of preemption of the VMs by Azure without notice. You can also select the auto-scaling option. With auto-scaling, the Batch service will periodically evaluate your formula and dynamically adjusts the number of nodes within the pool according to the current workload and resource usage of your compute scenario. Finally you choose the hardware configuration of the machines. Every machine in the pool shares the same hardware configuration. There are hundreds of possible configurations, and the variables are basically the number of CPUs cores, RAM and Storage size.

On a second step you define the environment. You select the OS that will be installed on the VMs. At the moment there are available Windows and some Linux distributions (Debian, Ubuntu, CentOS, Oracle Linux). Once the OS is autonomousòy installed by the service, you can set up a series of starting tasks that will be performed on every machine. That includes the installation of libraries, software, packages, frameworks. After that you can retrieve the program or script you need to execute on the machines depending on your software distribution (i.e. Gist, downloading from Azure Storage, uploading on Azure Storage and then downloading it to the VMs).

Once the pool is instantiated and all the starting tasks are completed, the service starts the execution of the workload. It’s important to note that VMs are temporary. If the task you are executing produces an output, that output must be stored in a permanent storage, for example the Azure Blob Storage/Data Lake. If a VM is disposed, any file on it is deleted, and so are the eventual log files. So it is of the most importance to export every file needed from the VMs before the pool is emptied or deleted.

You interact with the service through APIs, scripts or with the Batch Explorer client. Every aspect of the workflow described above is handled via APIs. Also you can monitor the execution of the task in the various stages of processing. Each VM in the pool can be accessed via SSH tunnel. The Batch Explorer client offers a dashboard to monitor the status of tasks and machines, it also offers a statistical report at the end of the execution. Another way to extract information is through the use of external tools, i.e. the production of stats files by the software you’re running.

An important part of the whole process is the handling of failure. A task can fail in many ways. There could be a network error while uploading a file to the storage, a missing dependencies, a low priority VM preempted. Batch detects the error and notify it through the Batch Explorer. If a task fails, it is up to the user to set up the re-execution. If a VM is sized by Azure, the task that was running on it is reassigned to another node automatically. Another possible way to notify the errors could be note it to an external systems (eg. DAG job scheduler like Apache Airflow).

![alt link](https://user-images.githubusercontent.com/47110912/95857294-af599200-0d5b-11eb-9870-d835e358782d.png)

Fig 2. Workflow of Azure Batch

### Costs

Batch Service is free. What you are paying for is the usage of allocated resources, i.e. the VMs. As said, it’s a cost efficient platform. Here is a comparison between the hourly usage of a dedicated Azure VM, a dedicated Batch and a low priority Batch VM. Basically there is no price difference between a dedicated plain VM and a dedicated Batch VM. The difference is notable with the low priority Batch VM. Note that the prices refer to a Linux distribution OS running on the VM.

| Model           | CPUs | RAM    | Storage  | Dedicated Plain VM | Dedicated Batch VM | Low priority Batch VM |
| --------------- | ---- | ------ | -------- | ------------------ | ------------------ | --------------------- |
| D8s Standard v3 | 8    | 32 GB  | 64 GB    | 0,405 €/hour       | 0,405 €/hour       | 0,081 €/hour          |
| E32 Standard v3 | 32   | 256 GB | 512 GB   | 2,159 €/hour       | 2,159 €/hour       | 0,432 €/hour          |

Tab 1. Price per hours comparison examples between plain VM, dedicated Batch VM, low priority Batch VM

### Best Practices

After several tests that we have carried out, we have accumulated a series of experiences that can be translated into some best practices to be adopted when using the Batch service.

1. There are various options for using your own software:

    1. Upload it locally to an Azure storage and then download it to the VMs in the pool
    2. Use a remote repository and invoke a download of the resource on the VMs during the initial environment setup phase.

2. If access credentials are used, it is good practice not to upload them to the storage, but to pass them to the scripts/software that you intend to use through a bootstrap script or via config file from a local machine or from a serverless platform (i.e. Nuclio).

3. It is important to think of tasks in such a way as to make them as atomic and parallelizable as possible. This makes it easier to manage and monitor them. Furthermore, if you manage to contain the amount of resources necessary to perform the tasks, you can use smaller VMs, with savings in terms of money and less probability of seizure of the machines by Azure.

4. It is useful to produce stats files when processing tasks. We must then remember to upload these files on permanent storage because, as already stated, when the machines are deleted, all the files present there are deleted. To monitor the use of resources by the machines in the pool, it is useful to install monitoring packages such as htop, iftop etc.