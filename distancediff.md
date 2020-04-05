# The Distance Diff Algorithm

The distance diff algorithm uses the $\sqrt{(x_{2}-x_{1})^2+(y_{2}-y_{1})^2}$, the distance formula, to decide which elements to keep. All the matches are between elements in the new and the old are found, then passed through the distance algorithm. Using the elements to keep, the elements in the old that are not part of the same elements are marked as remove, while elements in the new that are not part of the same elements are marked as insert.

## Same

```python
def same(old, new):  # old and new should be split into elements
    matching_elements = [item for sublist in map(
        lambda x: map(
            lambda y: [x[0], y[0]],
            filter(
                lambda z: z[1] == x[1], enumerate(old)
            ),
        ),
        enumerate(new),
    ) for item in sublist]

    return matching_elements
```

```python
def same_(old, new):  # old and new should be split into elements
    matching_elements = []

    for index_new, item_new in enumerate(new):
        for index_old, item_old in enumerate(old):
            if item_new == item_old:
                matching_elements.append([index_new, index_old])

    return matching_elements
```
