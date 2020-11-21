# def lcs(old_values, new_values, start=0, end=0):
#     start_matches = []
#     end_matches = []

#     start_index = start
#     end_index = end

#     while old_values[start_index] == new_values[start_index]:
#         start_matches.append([start_index, start_index])
#         start_index += 1

#     while old_values[-(end_index + 1)] == new_values[-(end_index + 1)]:
#         end_matches.append(
#             [
#                 len(old_values) - (end_index + 1),
#                 len(new_values) - (end_index + 1),
#             ]
#         )
#         end_index += 1

#     front_matches = []
#     remove = []
#     modifier = 0

#     while old_values[start_index] != new_values[start_index + modifier]:
#         remove.append(start_index)
#         modifier += 1


def match_start(old_values, new_values, old_index, new_index):
    matches = []

    old_index = old_index
    new_index = new_index

    while (
        old_index < len(new_values)
        and new_index < len(new_values)
        and old_values[old_index] == new_values[new_index]
    ):
        matches.append([old_index, new_index])
        old_index += 1
        new_index += 1

    return matches, old_index, new_index


def match_end(old_values, new_values, old_index, new_index):
    matches = []

    old_index = len(old_values) + old_index if old_index < 0 else old_index
    new_index = len(new_values) + new_index if new_index < 0 else new_index

    while (
        old_index >= 0
        and new_index >= 0
        and old_values[old_index] == new_values[new_index]
    ):
        matches.append([old_index, new_index])
        old_index -= 1
        new_index -= 1

    return matches, old_index, new_index


def lookup(
    old_values,
    new_values,
    start_old=0,
    start_new=0,
    end_old=-1,
    end_new=-1,
):
    start_matches, start_old, start_new = match_start(
        old_values,
        new_values,
        start_old,
        start_new,
    )

    end_matches, end_old, end_new = match_end(
        old_values,
        new_values,
        end_old,
        end_new,
    )

    if (
        end_old <= start_old
        and start_old >= end_old
    ):
        return (
            start_matches
            + end_matches
        )

    start_modifier = 0

    while (
        start_old + start_modifier > end_old
        and old_values[start_old + start_modifier]
        != new_values[start_new]
    ):
        start_modifier += 1

    end_modifier = 0

    while (
        end_old - end_modifier < start_old
        and old_values[end_old - end_modifier]
        != new_values[end_new]
    ):
        end_modifier += 1

    print(f"matches: {start_matches + end_matches}")
    print(f"start_old: {start_old}")
    print(f"start_new: {start_new}")
    print(f"end_old: {end_old}")
    print(f"end_new: {end_new}")
    print(f"start_modifier: {start_modifier}")
    print(f"end_modifier: {end_modifier}")

    matches = lookup(
        old_values,
        new_values,
        start_old + start_modifier,
        start_new,
        end_old - end_modifier,
        end_new,
    )

    print(f"final: {start_matches + matches + end_matches}")

    return start_matches + matches + end_matches

    # matches = []

    # for old_index, old_value in enumerate(old_values[start_old + 1 : end_old]):
    #     for new_index, new_value in enumerate(new_values[start_new + 1 : end_new]):
    #         if old_value == new_value:
    #             matches.append([old_index, new_index])

    # keep = []

    # start_modifier = 0

    # while (
    #     start_old + start_modifier < end_old
    #     and old_values[start_old + start_modifier] != new_values[start_new]
    # ):
    #     print("afs")
    #     start_modifier += 1

    # end_modifier = 0

    # while (
    #     end_old - end_modifier > start_old
    #     and old_values[end_old - end_modifier] != new_values[end_new]
    # ):
    #     print("fsd")
    #     end_modifier += 1

    # print(start_old, start_new, end_old, end_new)

    # if start_old != end_old - end_modifier and start_new != end_new:
    #     print("blah")
    #     matches = diff(
    #         old_values,
    #         new_values,
    #         start_old + start_modifier,
    #         start_new,
    #         end_old - end_modifier,
    #         end_new,
    #     )
    #     return start_matches + matches + end_matches

    # print("lah")
    # return start_matches + end_matches

def diff(old_values, new_values):
    matches = []
    last = [-1, -1]

    for value in lookup(old_values, new_values):
        if value[0] > last[0] and value[1] > last[1]:
            matches.append(value)
            last = value

    return matches

print(diff(list("ABCDEF"), list("ABCEDF")))
