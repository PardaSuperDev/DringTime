import os
import re
import shutil
import sys
import json
from uuid import uuid4

default_db = '{"providers" : {}, "alarms" : {}}'

alarms_regex = re.compile(r'^((?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d);)*((?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d))?-(((?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d);)*((?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d))?-){5}(((?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d);)*((?:[01]\d|2[0-3]):(?:[0-5]\d):(?:[0-5]\d)))?')

def add_provider(name):
    with open("data/data.json", "r") as f:
        data = json.loads(f.read())

    new_uuid = str(uuid4())

    data["providers"][name] = new_uuid
    data["alarms"][new_uuid] = "------"  # Correspond to a blank day
    
    with open("data/data.json", "w") as f:
        f.write(json.dumps(data))
    
    print(f"New provider {name} successfully added!")

def remove_provider(name):
    with open("data/data.json", "r") as f:
        data = json.loads(f.read())

    p_uuid = data["providers"][name]
    data["providers"].pop(name)
    data["alarms"].pop(p_uuid)
    
    with open("data/data.json", "w") as f:
        f.write(json.dumps(data))
    
    print(f"Provider {name} successfully removed!")

def get_alarms(name, day=-1):
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

def set_alarms(name, value, day=-1):
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

def setup_new(force=False):
    if os.path.isdir("data"):
        print("A database already exists in the current folder.\nDo you want to override it?\n")
        if not force:
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
        


help_str = \
"""DB manager help:

    db_manager.py help
        Show this help message
    
    db_manager.py setup [-f]
        Setup a new database. Will ask for confirmation if the database already exist. Use `-f` to bypass asking for confirmation.
    
    db_manager.py add <name>
        Add a provider with no registered alarms

    db_manager.py remove <name>
        Remove the provider
    
    db_manager.py alarms <set/get> <all/day> <name> [day number]
        Edit or get data from an alarm.
        "all" access to all the alarms
        "day" access to a specific day
"""

if __name__ == "__main__":
    if len(sys.argv) == 1:
        print(help_str)
    elif sys.argv[1] == "help":
        print(help_str)
    elif sys.argv[1] == "add":
        if len(sys.argv) == 2:
            print("Missing argument <name>. See `db_manager.py help` for more help.")
        elif len(sys.argv) > 3:
            print("Too many argument. See `db_manager.py help` for more help.")
        else:
            add_provider(sys.argv[2])
    elif sys.argv[1] == "setup":
        if len(sys.argv) == 3:
            if sys.argv[2] == "-f":
                setup_new(True)
            else:
                print(f"Bad argument {sys.argv[2]}. See `db_manager.py help` for more help.")
        elif len(sys.argv) > 3:
            print("Too many argument. See `db_manager.py help` for more help.")
        else:
            setup_new()
    elif sys.argv[1] == "remove":
        if len(sys.argv) == 2:
            print("Missing argument <name>. See `db_manager.py help` for more help.")
        elif len(sys.argv) > 3:
            print("Too many argument. See `db_manager.py help` for more help.")
        else:
            remove_provider(sys.argv[2])
    elif sys.argv[1] == "alarms":
        if len(sys.argv) == 2:
            print("Missing argument <set/get>. See `db_manager.py help` for more help.")
        elif len(sys.argv) > 7:
            print("Too many argument. See `db_manager.py help` for more help.")
        else:
            if sys.argv[2] == "get":
                if len(sys.argv) == 3:
                    print("Missing argument <all/day>. See `db_manager.py help` for more help.")
                elif not (sys.argv[3] == "all" or sys.argv[3] == "day"):
                    print(f"Unknown option {sys.argv[3]}. See `db_manager.py help` for more help.")
                elif len(sys.argv) == 4:
                    print("Missing argument <name>. See `db_manager.py help` for more help.")
                elif sys.argv[3] == "day" and len(sys.argv) == 6 and not sys.argv[5].isdigit():
                    print("Argument [day number] must be an integer. See `db_manager.py help` for more help.")
                elif sys.argv[3] == "all" and len(sys.argv) == 6:
                    print("Argument [day number] not needed with 'all'. See `db_manager.py help` for more help.")
                else:
                    if sys.argv[3] == "all":
                        if len(sys.argv) > 5:
                            print("Too many argument. See `db_manager.py help` for more help.")
                        else:
                            get_alarms(sys.argv[4], -1)
                    else:
                        if len(sys.argv) == 5:
                            print("Missing argument [day number]. See `db_manager.py help` for more help.")
                        else:
                            get_alarms(sys.argv[4], int(sys.argv[5]))
            elif sys.argv[2] == "set":
                if len(sys.argv) == 3:
                    print("Missing argument <all/day>. See `db_manager.py help` for more help.")
                elif not (sys.argv[3] == "all" or sys.argv[3] == "day"):
                    print(f"Unknown option {sys.argv[3]}. See `db_manager.py help` for more help.")
                elif len(sys.argv) == 4:
                    print("Missing argument <name>. See `db_manager.py help` for more help.")
                elif sys.argv[3] == "day" and len(sys.argv) == 7 and not sys.argv[6].isdigit():
                    print("Argument [day number] must be an integer. See `db_manager.py help` for more help.")
                elif sys.argv[3] == "all" and len(sys.argv) == 7:
                    print("Argument [day number] not needed with 'all'. See `db_manager.py help` for more help.")
                else:
                    if sys.argv[3] == "all":
                        if len(sys.argv) > 6:
                            print("Too many argument. See `db_manager.py help` for more help.")
                        else:
                            set_alarms(sys.argv[4], sys.argv[5])
                    else:
                        if len(sys.argv) == 5:
                            print("Missing argument [day number]. See `db_manager.py help` for more help.")
                        else:
                            set_alarms(sys.argv[4], sys.argv[5], int(sys.argv[6]))
            else:
                print(f"Unknown option {sys.argv[2]}. See `db_manager.py help` for more help.")
    else:
        print(f"Unknown option {sys.argv[1]}. See `db_manager.py help` for more help.")