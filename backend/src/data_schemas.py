import re


ACCOUNT_CREATION_PACKET_SCHEMA = {
    "username": re.compile(r".{2,}"),
    "email": re.compile(r"^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$"),
    "password": re.compile(r".{6,}")
    }