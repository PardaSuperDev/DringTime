import os
import re
import shutil
import sys
import json
from uuid import uuid4
from customcommand import command, handle_commands

default_db = '{"providers" : {}, "alarms" : {}}'

alarms_regex = re.compile(r'^((?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d);)*((?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d))?-(((?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d);)*((?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d))?-){5}(((?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d);)*((?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d)))?')

@command
def add_provider(name):
    """Add a provider with no registered alarms."""
    with open("data/data.json", "r") as f:
        data = json.loads(f.read())

    new_uuid = str(uuid4())

    data["providers"][name] = new_uuid
    data["alarms"][new_uuid] = "------"  # Correspond to a blank day
    
    with open("data/data.json", "w") as f:
        f.write(json.dumps(data))
    
    print(f"New provider {name} successfully added!")

@command
def remove_provider(name):
    """ Remove the provider."""
    with open("data/data.json", "r") as f:
        data = json.loads(f.read())

    p_uuid = data["providers"][name]
    data["providers"].pop(name)
    data["alarms"].pop(p_uuid)
    
    with open("data/data.json", "w") as f:
        f.write(json.dumps(data))
    
    print(f"Provider {name} successfully removed!")

@command
def get_alarms(name, day: int=-1):
    """Get the alarms for the given provider. Day correspond to a specific day in the week. -1 correspond to the entiere week."""
    with open("data/data.json", "r") as f:
        data = json.loads(f.read())

    if name in data["providers"]:
        alarms = data["alarms"][data["providers"][name]]
    else:
        print(f"No alarms are registered with the name {name}.")
        return
    if day == -1:
        print(alarms)
    else:
        if day >=0 and day < 7:
            print(alarms.split("-")[day])
        else:
            print("Day number must be between 0 and 6. (included)")

@command
def set_alarms(name, value, day:int=-1):
    """Set the alarms for the given provider. Day correspond to a specific day in the week. -1 correspond to the entiere week."""
    with open("data/data.json", "r") as f:
        data = json.loads(f.read())

    if name in data["providers"]:
        if day == -1:
            if alarms_regex.fullmatch(value):
                data["alarms"][data["providers"][name]] = value
            else:
                print("Invalid alarms.")
                return
        else:
            if day >=0 and day < 7:
                alarms = data["alarms"][data["providers"][name]].split("-")
                alarms[day] = value
                week = "-".join(alarms)
                if alarms_regex.fullmatch(week):
                    data["alarms"][data["providers"][name]] = week
                else:
                    print("Invalid alarms.")
                    return
            else:
                print("Day number must be between 0 and 6. (included)")
    else:
        print(f"No alarms are registered with the name {name}.")
        return
    
    with open("data/data.json", "w") as f:
        f.write(json.dumps(data))
    
    print("Alarms updated.")

@command
def list_providers():
    """List all the providers"""
    with open("data/data.json", "r") as f:
        data = json.loads(f.read())
    
    print("List of providers:")
    for i in data["providers"]:
        print(f"    - {i}")

@command
def setup_new(force=""):
    """Setup a new database. Will ask for confirmation if the database already exist. Use `-f` to bypass asking for confirmation."""
    if os.path.isdir("data"):
        print("A database already exists in the current folder.\nDo you want to override it?\n")
        if force != "-f":
            confirm = input("Replace ? (NO/yes) ").lower()
            if not confirm.startswith("y"):
                print("Cancelled setup")
                return
        print("Asked for override")
        shutil.rmtree("data")
    
    os.mkdir("data")
    with open("data/data.json", "w") as f:
        f.write(default_db)
    print("New database ready to use!")
        

handle_commands()
