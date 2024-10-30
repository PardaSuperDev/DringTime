import re


ACCOUNT_CREATION_PACKET_SCHEMA = {
    "pseudo": re.compile(r".{2,}"),
    "email": re.compile(r"^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$"),
    "password": re.compile(r".{6,}")
    }