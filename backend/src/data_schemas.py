import re


ACCOUNT_CREATION_PACKET_SCHEMA = {
    "username": re.compile(r"[a-z0-9A-Z_\-@\.]{2,}"),
    "email": re.compile(r"^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$"),
    "password": re.compile(r".{6,}")
    }

ACCOUNT_CONNEXION_PACKET_SCHEMA = {
    "username": re.compile(r"[a-z0-9A-Z_\-@\.]{2,}"),
    "password": re.compile(r".{6,}")
}

SEND_ALARMS_PACKET_SCHEMA = {
    "data" : re.compile('^((?:[01]\\d|2[0-3]):(?:[0-5]\\d):(?:[0-5]\\d);)*((?:[01]\\d|2[0-3]):(?:[0-5]\\d):(?:[0-5]\\d))?-(((?:[01]\\d|2[0-3]):(?:[0-5]\\d):(?:[0-5]\\d);)*((?:[01]\\d|2[0-3]):(?:[0-5]\\d):(?:[0-5]\\d))?-){5}(((?:[01]\\d|2[0-3]):(?:[0-5]\\d):(?:[0-5]\\d);)*((?:[01]\\d|2[0-3]):(?:[0-5]\\d):(?:[0-5]\\d)))?'),
    "name" : re.compile(r".{4,25}")
}