import sys
import json
import datajudge as dj
import time

config = {
    "full_csv_name": "./companies_data.csv",
    "full_schema_name": "./companies_schema.json",
    "data_resource_name": "Companies",
    "project_id": "proj1",
    "experiment_name": "companies_exp",
    "run_id": "companies_run",
    "metadata_store_uri": "backend_instance_address",
    "metadata_store_config": {
        "auth": "oauth",
        "token": "your_aac_implicit_token"
    }
}

localtime = time.localtime(time.time())
print(time.strftime('%H:%M:%S', localtime) + ' - Instantiating DataResource...', flush = True)

data_resource = dj.DataResource(
        config['full_csv_name'],
        schema=config['full_schema_name'],
        name=config['data_resource_name']
)

localtime = time.localtime(time.time())
print(time.strftime('%H:%M:%S', localtime) + ' - Instantiating client...', flush = True)

client = dj.Client(
        project_id=config['project_id'],
        experiment_name=config['experiment_name'],
        metadata_store_uri=config['metadata_store_uri'],
        metadata_store_config=config['metadata_store_config']
)

localtime = time.localtime(time.time())
print(time.strftime('%H:%M:%S', localtime) + ' - Running...', flush = True)

run = client.create_run(data_resource, "frictionless", run_id=config['run_id'])

with run:
    run.log_data_resource()
    run.log_short_report()
    run.log_short_schema()
    run.log_profile()
    run.persist_full_report()
    
localtime = time.localtime(time.time())
print(time.strftime('%H:%M:%S', localtime) + ' - Done.', flush = True)