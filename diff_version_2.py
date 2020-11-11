def diff(old, new, separator=""):
    if separator == "":
        old = list(old)
    else:
        old = old.split(separator)

    if separator == "":
        new = list(new)
    else:
        new = new.split(separator)

    old_index = 0
    new_index = 0
    cache = []

    while len(old) > len(new):
        cache.append(old.pop())
        print("remove")

    while new_index < len(new):
        if not old_index < len(old):
            old_index = len(old) - 1

        old_value = old[old_index]
        new_value = new[new_index]

        if old_value == new_value:
            print("same")
        else:
            cache.append(old.pop(old_index))

            if new_value in cache:
                old.insert(old_index, cache.pop(cache.index(new_value)))
            else:
                old.insert(old_index, new_value)

            print("replace")

        new_index += 1
        old_index += 1

    return old

print(diff("ABCABBA", "CBABAC"))
print(diff("ABCDEFG", "ABCEDFGA"))
