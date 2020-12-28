def match_start(old_values, new_values):
    matches = []
    index = 0

    for old_value, new_value in zip(old_values, new_values):
        if old_value != new_value:
            break

        matches.append([index, index])
        index += 1

    return matches


def match_end(old_values, new_values):
    matches = []
    index = 1

    for old_value, new_value in zip(old_values[::-1], new_values[::-1]):
        if old_value != new_value:
            break

        matches.append([len(old_values) - index, len(new_values) - index])
        index += 1

    return matches


def find_start(old_values, new_values):
    old_index = 0
    new_index = 0
    index_sum = float("inf")
    matches = []

    while (
        old_index < len(old_values)
        and new_index < len(new_values)
        and old_index <= index_sum
    ):
        old_value = old_values[old_index]
        new_value = new_values[new_index]
        current_sum = old_index + new_index

        if old_value == new_value and current_sum <= index_sum:
            matches.append([old_index, new_index])
            index_sum = current_sum

        if current_sum >= index_sum:
            old_index += 1
            new_index = 0
        else:
            new_index += 1

    if len(matches) > 0:
        return matches[-1]


def diff(old_values, new_values):
    start_matches = match_start(old_values, new_values)
    end_matches = match_end(old_values, new_values)

    if len(start_matches) > 0:
        old_min, new_min = start_matches[-1]
    else:
        old_min = 0
        new_min = 0

    if len(end_matches) > 0:
        old_max, new_max = end_matches[-1]
    else:
        old_max = len(old_values) - 1
        new_max = len(new_values) - 1

    found_start = find_start(
        old_values[old_min + 1 : old_max],
        new_values[new_min + 1 : new_max],
    )

    if found_start is not None:
        start_match = [found_start[0] + old_min, found_start[1] + new_min]
    else:
        start_match = [old_min, new_min]
