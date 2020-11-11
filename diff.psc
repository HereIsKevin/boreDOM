set old index to 0
set new index to 0

set cache to list

for new value in new values
    set old value to value at old index in old values

    if new value is equal to old value
        increment new index by 1
        increment old index by 1
    else
        increment new index by 1
        pop old value from old values and append to cache

set index to 0

while index is less than length of new values
    set old value to value at index in old values
    set new value to value at index in new values

    if new value is equal to old value
        increment index by 1
    else if new value is in cache
        pop new value from cache and insert to old values at index
    else
        copy new value and insert to old values at index
