def diff(old_values, new_values):
    old_values = list(old_values)

    old_index = 0
    new_index = 0

    cache = []

    for new_value in new_values:
        if not old_index < len(old_values):
            break

        # print(f"{old_index=}\n{new_index=}\n{old_values=}\n{new_values=}")

        old_value = old_values[old_index]

        # print(f"{old_value=}\n{new_value=}\n")

        if new_value == old_value:
            new_index += 1
            old_index += 1
            print("same")
        else:
            new_index += 1
            cache.append(old_values.pop(old_index))
            print("remove")

    print(old_values)

    index = 0

    while index < len(new_values):
        # print(f"{old_values=}\n{new_values=}\n{index=}\n")

        if index < len(old_values):
            old_value = old_values[index]
        else:
            old_value = None

        new_value = new_values[index]

        if new_value == old_value:
            index += 1
        elif new_value in cache:
            old_values.insert(index, cache.pop(cache.index(new_value)))
            print("insert")
        else:
            old_values.insert(index, new_value)
            print("insert")

    return old_values


print(diff(list("ABCABBA"), list("CBABAC")))
print(diff(list("ABCDEFG"), list("ABCEDFGA")))
