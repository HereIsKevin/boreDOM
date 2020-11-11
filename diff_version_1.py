def diff(old, new, separator=""):
    if separator == "":
        old = list(old)
    else:
        old = old.split(separator)

    if separator == "":
        final = list(new)
    else:
        final = new.split(separator)

    index = 0
    cache = []

    current = old[0]

    while len(old) > len(final):
        cache.append(old.pop())
        print("remove")

    while index < len(final):
        final_value = final[index]

        if index < len(old):
            current = old[index]
        else:
            current = old[-1]

        if final_value == current:
            index += 1
            # print("same")
        elif final_value in cache:
            value = cache.pop(cache.index(final_value))
            old.insert(index, value)

            if index < len(old) - 1:
                print("cache replace")
                cache.append(old.pop(index + 1))
            else:
                print("cache insert")
        else:
            old.insert(index, final_value)

            if index < len(old) - 1:
                print("replace")
                cache.append(old.pop(index + 1))
            else:
                print("insert")

    return old

print(diff("ABCABBA", "CBABAC"))
