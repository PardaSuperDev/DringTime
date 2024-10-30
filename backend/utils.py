from types import UnionType
import re

class Choise:
    def __init__(self, *args):
        self.values = args

    def match(self, value):
        return value in self.values
    
    
def check_iterable_integrity(it: list | dict, schema: dict | list):
    """Check if the given list or dict respect the given schema."""
    if type(it) != type(schema):
        return False
    
    if isinstance(it, dict):
        for i in it:
            if i not in schema:
                return False
        
        if len(it.keys()) != len(schema.keys()):
            return False
    elif isinstance(it, list):
        if not len(schema) == len(it):
                return False
    else:
        return False

    for i in it if isinstance(it, dict) else range(len(it)):
        if isinstance(schema[i], type | UnionType):
            if not isinstance(it[i], schema[i]):
                return False
        elif isinstance(schema[i], dict) and len(schema[i].keys()) != 0:
            if not check_iterable_integrity(it[i], schema[i]):
                return False
        elif isinstance(schema[i], list) and len(schema[i]) != 0:
            if not check_iterable_integrity(it[i], schema[i]):
                return False
        elif isinstance(schema[i], Choise):
            if not schema[i].match(it[i]):
                return False
        elif isinstance(schema[i], re.Pattern):
            schema[i].fullmatch(it[i])
        else:
            if not schema[i] == it[i]:
                return False
    return True
