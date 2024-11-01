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
