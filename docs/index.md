---
title: GraphFellow documentation
layout: default
---

_beta: GraphFellow is still in development!_

# GraphFellow documentation

* [quick start](#quick-start)
* [examples](examples)
* [HTML for graphs](html)
* [settings & config](settings)
* [programming graph behaviour](behaviour)

<script src="../vendor/pixi.min.js"></script>
<script src="../vendor/greensock-js/TweenMax.min.js"></script>
<div class="graphfellow"
  data-graph-src="examples/example.json"
  data-graph-config="background-color:0xf2f2f2"
  style="width:500px;height:300px"></div>
<script src="../graphfellow.js"></script>
# Quick start

Create `example.json` defining a graph on a `1000` × `1000` grid (the default),
with a "tick" every 2 seconds. This graph has four **vertices** joined by 
six **edges**, and one **traveller** that moves along them:

```json
{
  "vertices": [
    { "id": "A", "x": 300, "y": 125 },
    { "id": "B", "x": 700, "y": 125 },
    { "id": "C", "x": 700, "y": 475 },
    { "id": "D", "x": 300, "y": 475 }
  ],
  "edges": [
    { "from": "A", "to": "B" },
    { "from": "B", "to": "C" },
    { "from": "C", "to": "D" },
    { "from": "D", "to": "A" },
    { "from": "A", "to": "C", "is_bidirectional": true, "journey_duration": 1.4 },
    { "from": "B", "to": "D", "is_bidirectional": true, "journey_duration": 1.4 }
  ],
  "travellers": [
    {
      "at_vertex": "A", "radius": 20, "on_arrival": "_pulse",
      "fill_color": "0xff0000", "stroke_color": "0xff0000"
    }
  ],
  "config": {
    "vertices": {
      "stroke_width": 6,
      "radius": 80,
      "text_font_size": 60,
      "has_pulse": true,
      "pulse_scale": 1.1,
      "is_pulse_blur": false
    },
    "edges": {
      "stroke_width": 6,
      "arrowhead_length": 24
    },
    "tick_period": 2,
    "on_tick": "_send_travellers_on_all_random"
  }
}
```

Include the [Pixi.js](https://www.pixijs.com) and
[Greensock](https://greensock.com) libraries that GraphFellow uses. Use a CDN,
or provide local copies.

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/5.1.0/pixi.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/2.1.3/TweenMax.min.js"></script>
```

Load `graphfellow.js`:

```html
<script src="graphfellow.js"></script>
```

Add a container with class `graphfellow`, and link to its JSON:

```html
<div class="graphfellow" data-graph-src="example.json"></div>
```

Populate the graph with `init`:

```html
<script> GraphFellow.init() </script>
```

...and graphy magic happens.


---

<br><br><br>

Really `graphfellow.js` is probably all you need, but if you download the whole
repo you'll get all the example source files to poke around in too.

* see more [examples](examples)
* detailed docs mostly cover [settings & config](settings)
* how to [program graph behaviour](behaviour) with JavaScript

<script> GraphFellow.init() </script>

