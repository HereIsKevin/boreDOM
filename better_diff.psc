set old index to 0
set new index to 0

set cache to list

for new value in new values
    if old_index is not less than length of old values
        break

    set old value to value at old index in old values

    if new value is equal to old value
        increment new index by 1
        increment old index by 1
    else
        set current index to old index

        while current index is less than length of old values
            set current value to value at current index in old values

            if current value is equal to new value
                while current index is greater than 0
                    pop value at old index in old values and append to cache
                    decrement current index by 1

                break
            else
                increment current index by 1

        increment new index by 1

set index to 0

while index is less than length of new values
    if index is less than length of old values
        set old value to value at index in old values
    else
        set old value to none

    set new value to value at index in new values

    if new value is equal to old value
        increment index by 1
    else if new value is in cache
        pop new value from cache and insert to old values at index
    else
        copy new value and insert to old values at index
