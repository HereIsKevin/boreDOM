from itertools import zip_longest

def lcs(old_values, new_values):
    same = []

    old_index = 0
    new_index = 0

    modifier = 0

    while old_index < len(old_values) and new_index < len(new_values):
        old_value_1 = old_values[old_index + modifier] if old_index + modifier < len(old_values) else None
        new_value_1 = new_values[new_index]

        old_value_2 = old_values[old_index]
        new_value_2 = new_values[new_index + modifier] if new_index + modifier < len(new_values) else None

        if old_value_1 is None and new_value_2 is None:
            old_index += 1
            modifier = 0
            # new_index += 1

        # print(modifier)

        if old_value_1 != new_value_1 and old_value_2 != new_value_2:
            modifier += 1
        elif old_value_1 == new_value_1:
            old_index += modifier
            modifier = 0
            same.append([old_index, new_index])
        elif old_value_2 == new_value_2:
            new_index += modifier
            modifier = 0
            same.append([old_index, new_index])

    # while old_index < len(old_values) and new_index < len(new_values):
    #     old_value = old_values[old_index]
    #     new_value = new_values[new_index]

    #     if old_value != new_value:
    #         old_index += 1
    #     else:
    #         same.append([old_index, new_index])
    #         old_index += 1
    #         new_index += 1

    return same


def diff(old_values, new_values):
    old_values = list(old_values)

    if len(old_values) == 0:
        old_values.extend(new_values)
        return

    if len(new_values) == 0:
        old_values.clear()
        return

    cache = []
    length = max(len(new_values), len(old_values))
    modifier = 0
    indexes = []

    for index in range(0, length):
        position = index - modifier
        old_value = old_values[position] if position < len(old_values) else None
        new_value_position = (
            new_values[position] if position < len(new_values) else None
        )
        new_value_index = new_values[index] if index < len(new_values) else None

        print("index:", index)
        print("position:", position)
        print("old value:", old_value)
        print("new value at position:", new_value_position)
        print("new value at index:", new_value_index)

        print(old_values)

        if (
            old_value is not None
            # and old_value != new_value_position
            and old_value != new_value_index
        ):
            cache.append(old_values.pop(position))
            modifier += 1
            indexes.append(index)

    print(indexes)

    index = 0

    while index < len(new_values):
        old_value = old_values[index] if index < len(old_values) else None
        new_value = new_values[index]

        if new_value == old_value:
            index += 1
            continue

        if old_value in cache:
            value = cache.pop(cache.index(old_value))
        else:
            value = new_value

        if old_value is not None:
            old_values.insert(index, value)
        else:
            old_values.append(value)

    return old_values


a = list("ABCABBA")
b = list("CBABAC")

print(lcs(a, b))
# print(diff(a, b))
