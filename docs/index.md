---
title: GraphFellow documentation
layout: default
---

_beta: GraphFellow is still in development!_

# GraphFellow documentation

* [quick start](#quick-start)
* [examples](examples)
* [settings & config](settings)
* [programming graph behaviour](behaviour)

<script src="../vendor/pixi.min.js"></script>
<script src="../vendor/greensock-js/TweenMax.min.js"></script>
<div class="graphfellow" data-graph-src="example-graphs/example.json" style="width:500px;height:300px"></div>
<script src="../graphfellow.js"></script>

# Quick start

Create `example.json`:
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

Include the Pixi.js and Greensock libraries that GraphFellow uses. Use a CDN, or provide local copies.

```html
  <script src="vendor/pixi.min.js"></script>
  <script src="vendor/greensock-js/TweenMax.min.js"></script>
```

Add a container `<div>` with class `graphfellow`, and link to its JSON definition with `data-graph-src`:

```html
  <div class="graphfellow" data-graph-src="example.json"></div>
```

Load `graphfellow.js` when your DOM is ready, and it will populate the container with the graph.

```html
  <script src="graphfellow.js"></script>
```

---

* [examples](examples)
* [settings & config](settings)
* [programming graph behaviour](behaviour)
