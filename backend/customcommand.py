import inspect
import os.path
import re
import sys
import textwrap
import types
import warnings

registered = []
filename = os.path.basename(inspect.getfile(sys.modules["__main__"]))


def command(func: types.FunctionType):
    signature = inspect.signature(func)

    parameters = list(signature.parameters.values())
    if func.__doc__ is not None:
        doc = re.sub("\n *", " ", func.__doc__)
        doc = "\n        ".join(textwrap.wrap(doc))  # Reformat the docstring
    else:
        doc = ""

    required_arg_count = 0
    for arg in parameters:
        if arg.default is arg.empty:
            required_arg_count += 1
        if isinstance(arg.annotation, types.UnionType):
            warnings.warn("Custom Command doesn't support UnionType. Arguments will be converted into strings.")

        if not (arg.annotation is str or arg.annotation is int or arg.annotation is float or arg.annotation is arg.empty):
            warnings.warn(f"Custom Command doesn't support {arg.annotation.__name__}. "
                          f"Arguments will be converted into strings.")

    registered.append(
        {
            "name": func.__name__[0:-1] if func.__name__.endswith("_") else func.__name__,
            "parameters": parameters,
            "doc": doc,
            "function": func,
            "required_arg_count": required_arg_count
        }
    )

    return func


@command
def help_():
    """Show this help. List all the commands."""
    for i in registered:
        print(f"python {filename} {i['name']}:")
        print(f"    Doc:\n        {i['doc']}")
        print("    Arguments:" if i["parameters"] else "    No argument required.")
        for arg in i["parameters"]:
            if isinstance(arg.annotation, types.UnionType):
                t = str(arg.annotation)
            elif arg.annotation is arg.empty:
                t = "str"
            else:
                t = arg.annotation.__name__
            if arg.default is arg.empty:
                print(f"        Optional - {arg.name}: {t}")
            else:
                print(f"        Required - {arg.name}: {t}")
        print("    Syntax: ", end="")
        for arg in i["parameters"]:
            print(f"<{arg.name}>" if arg.default is arg.empty else f"[{arg.name}]", end=" ")
        print()


def print_error(text):
    print("\x1b[1;31m"+text+"\x1b[0m")


def handle_commands():
    if len(sys.argv) < 2:
        print_error("Missing argument! See `python {filename} help` for help.")
        return
    for i in registered:
        if i["name"] == sys.argv[1]:
            if len(sys.argv)-2 > len(i["parameters"]):
                print_error(f"Too many arguments! See `python {filename} help` for help.")
            elif len(sys.argv)-2 < i["required_arg_count"]:
                print_error(f"Missing argument `{i['parameters'][len(sys.argv)-2]}`! See `python {filename} help` for help.")
            else:
                converted = []
                for arg in range(len(sys.argv)-2):
                    try:
                        if i["parameters"][arg].annotation is int:
                            converted.append(int(sys.argv[2 + arg]))
                        elif i["parameters"][arg].annotation is float:
                            converted.append(float(sys.argv[2 + arg]))
                        else:
                            converted.append(sys.argv[2 + arg])
                    except ValueError:
                        print_error(f"Invalid type for `{i['parameters'][arg].name}` argument! "
                                    f"`{i['parameters'][arg].name}` argument must be type "
                                    f"`{i['parameters'][arg].annotation.__name__}`.")
                        return
                i["function"](*converted)
            return
    print_error(f"Unknown argument `{sys.argv[1]}`! See `python {filename} help` for help.")
