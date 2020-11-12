def diff(old_values, new_values):
    old_values = list(old_values)

    old_index = 0
    new_index = 0

    cache = []

    for new_value in new_values:
        if not old_index < len(old_values):
            break

        old_value = old_values[old_index]

        if new_value == old_value:
            new_index += 1
            old_index += 1
            print("same")
        else:
            current_index = old_index

            while current_index < len(old_values):
                current_value = old_values[current_index]

                if current_value == new_value:
                    while current_index > 0:
                        cache.append(old_values.pop(old_index))
                        current_index -= 1
                        print("remove")

                    break
                else:
                    current_index += 1

            new_index += 1

    print(old_values)

    index = 0

    while index < len(new_values):
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
