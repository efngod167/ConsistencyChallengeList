# format for packs
All packs are stored in `data/_packs.json`, in a JSON list containing objects with pack name, pack color and pack levels.

When written out, an example packs file could look like this
```json
[
    {
        "name": "My fun pack!",
        "color": "#000000",
        "levels": [
            123456,
            234561
        ]
    },
    {
        "name": "my evil pack >:3",
        "color": "#ff0000",
        "levels": [
            444333,
            183825
        ]
    }
]
```

## each object

| Property | value |
|----------|-------|
|name      |a string with the name of the pack|
|color     |(optional) the color of the pack in a css color (usually hex)|
|levels    |an array containing numbers, referencing ids in the list's levels (note: **can only reference levels in the list!!**)|

## ok but how do i write this
<small>(if you are experienced in JSON, or can read the example format above, skip this and just go write it lol, this is intended for absolute beginners, as i assume some in this codebase might be)</small>

If you're creating a new file from scratch, MAKE SURE TO INCLUDE THE [] (square brackets)
```json
[

]
```
looks like this

Then for each list entry, first make sure the previous entry ends in a comma before writing your next one. then copy and paste this little template (or write it yourself, up to you)
```json
{
    "name": "abc",
    "color": "#ff00ff",
    "levels": [

    ]
}
```

Replace the `abc` next to the `name` with the name of your pack (lets go with `lorem ipsum` today) and replace the `#ff00ff` with the color of your choice (use [a color picker](https://htmlcolorcodes.com/color-picker/) if neccesary, lets go with `#FF9E8C`). If you do this, it will look like this.
```json
{
    "name": "lorem ipsum",
    "color": "#FF9E8C",
    "levels": [

    ]
}
```

Now, for each level in your pack, get its GD level id and write it out with commas inbetween (mine for example will be 2374, 2398, 2342 and 2384. note these **MUST** be in the list already) and then put it within the [] (square brackets) beside `"levels": `
```json
{
    "name": "lorem ipsum",
    "color": "#FF9E8C",
    "levels": [
        2374, 2398, 2342, 2384
    ]
}
```

Finally, pop it at the end of the packs! (make sure you dont put a comma at the end of the packs, json is really stingy about commas)

```json
[
    {
        "name": "My fun pack!",
        "color": "#000000",
        "levels": [
            123456,
            234561
        ]
    },
    {
        "name": "my evil pack >:3",
        "color": "#ff0000",
        "levels": [
            444333,
            183825
        ]
    },
    {
        "name": "lorem ipsum",
        "color": "#FF9E8C",
        "levels": [
            2374, 2398, 2342, 2384
        ]
    }
]
```
if you get it wrong, it should be pointed out when you make a pull request