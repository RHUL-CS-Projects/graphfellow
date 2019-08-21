---
title: "GraphFellow example: Galton board"
layout: default
---

_beta: GraphFellow is still in development!_

# GraphFellow example: Galton Board

* [quick start](../index)
* [more examples](../examples)
* [HTML for graphs](../html)
* [settings & config](../settings)
* [programming graph behaviour](../behaviour)

<style>
  .graphfellow {
    width: 100%;
    height: 50vw;
  }  
</style>
<script src="../../vendor/pixi.min.js"></script>
<script src="../../vendor/greensock-js/TweenMax.min.js"></script>

The [Galton Board](https://en.wikipedia.org/wiki/Bean_machine) is used to show
how normal distribution emerges from a combination of choices (Pascal's
triangle is in here too, if you start counting the number of paths). Each
marble starts at the top and makes a fifty-fifty left-right decision at every
vertex. Vertices count the number of marbles that have passed through. Marbles
appear every tick (about 2 seconds) or when you click on that top node.

[Just show the graph →](galton)

<div class="graphfellow" data-graph-src="galton.json" ></div>

<script src="../../graphfellow.js"></script>
<script>
  const max_cascade_depth = 6;
  const start_vertex_id = "00";
  const rainbow_colors = [0xee4035, 0xf37736, 0xfdf498, 0x7bc043, 0x0392cf, 0x4b0082];

  GraphFellow.add_function("drop_new_marble", function(event, graph){
    let v = graph.get_vertex_by_id(start_vertex_id);
    v.pulse(event.type === 'tick'? 0x0000ff:0x00ff00); // green for tap/click
    graph.create_traveller({
       "at_vertex": v, 
       "fill_color": rainbow_colors[ v.payload.value % rainbow_colors.length]
    }).travel(v.get_random_edge_out());
    v.payload.set(v.payload.value+1);
  });

  GraphFellow.add_function("marble_arrives", function(event, graph){
    let t = this;
    t.at_vertex.payload.set(t.at_vertex.payload.value+1);
    if (t.qty_journeys < max_cascade_depth) {
      t.travel(t.at_vertex.get_random_edge_out());
    } else {
      t.at_vertex.pulse();
      t.destroy(); // alternatively, config could set journey_lifespan: 6
    }
  });

  GraphFellow.init();
</script>

<hr style="margin-bottom:4em"/>

## Behind the scenes

The Galton Board example drops a new marble on every tick event (which is a
little slower than every 2 seconds). Extra marbles appear if you click on the
vertex at the top of the graph. Each vertex counts the number of marbles that
have rolled through it.

### HTML setup

First things first... like all the examples, this page starts
by loading the libraries GraphFellow needs:

```html
<script src="../../vendor/pixi.min.js"></script>
<script src="../../vendor/greensock-js/TweenMax.min.js"></script>
```
The container for the graph links to the JSON file that contains the graph's
config (see below):

```html
<div class="graphfellow" data-graph-src="galton.json" ></div>
```

Before defining custom functions, the GraphFellow library itself is loaded:

```html
<script src="../../graphfellow.js"></script>
```

### Config in the JSON

As the `data-graph-src` attribute shows, the graph is defined in
[`galton.json`](galton.json). You can click on that and
inspect the whole file, but the rest of this page describes the JSON
piece-by-piece.

There are 28 vertices: six rows, with one vertex in the top row, and six in the
bottom row. Each one needs a unique id (so the edges between them can be
defined). The system used is `nm` where `n` is the row number and `m` is the
count: so `00` is the id of the top node, and `66` the last (seventh) node in the
bottom (seventh) row.

The top vertex (`00`) is special: it has an `on_click` event that causes a new
marble (traveller) to appear, and has a different colour (pale blue). The bottom
row of vertices also have a different colour (pale pink).

```javascript
"vertices": [
  {"id": "00", "x": 500, "y":  50, "payload": 0,
     "on_click": "drop_new_marble", "fill_color": "0xeeeeff"},
  {"id": "10", "x": 440, "y": 110, "payload": 0},
  {"id": "11", "x": 560, "y": 110, "payload": 0},
  {"id": "20", "x": 380, "y": 170, "payload": 0},
  ...
  ...
  {"id": "66", "x": 860, "y": 410, "payload": 0, "fill_color": "0xffeeee"}
],
```

The edges (there are 42) are systematic once those vertices have been created —
here's just some of them:

```javascript
  "edges": [
    {"from": "00", "to": "10"},
    {"from": "00", "to": "11"},
    {"from": "10", "to": "20"},
    {"from": "10", "to": "21"},
    {"from": "11", "to": "21"},
    {"from": "11", "to": "22"},
    {"from": "20", "to": "30"},
    {"from": "20", "to": "31"},
    {"from": "21", "to": "31"},
    {"from": "21", "to": "32"},
    ...
    ...
    {"from": "55", "to": "66"}
],
```

There are no travellers (or marbles) defined, because they are created by
the `on_click` or `on_tick` events.

The only config for the graph relates to the `on_tick` behaviour. The same 
function that's the `on_click` event for the top node (dropping a marble)
is used. The `tick_period` is a little over 2 seconds. The default journey
along an edge is 1 second, so making the period between new marbles being
dropped slightly out of synch with that makes the behaviour a little more
aesthetic.

```javascript
  "config": {
    "on_tick": "drop_new_marble",
    "tick_period": 2.2,
```

The config for the vertices sets a pale yellow (which is overridden in the
definitions, above, for individual vertices: blue at the top, and red at the
bottom), and makes the font small enough to comfortably show 3 or even 4 digits
in the node (the number of marbles dropped will get bigger and bigger as the
animation runs).

```javascript
    "vertices": {
      "fill_color": "0xffffee",
      "is_pulse_blur": false,
      "pulse_scale": 1.3,
      "is_displaying_payload": true,
      "text_font_size": 16
    },
```

By default, edges have arrowheads, but this graph is drawn more simply without them
so the config suppresses them:

```javascript
    "edges": {
      "is_arrow": false
    },
```

Finally, each traveller (which by default is a "spot" or circle) has an `on_arrival` event
that will increment the count at the vertex at which it's just arrived. The `is_above_vertices`
setting ensures that the marbles are always visible as they roll over the graph.

```javascript
    "travellers": {
      "radius": 14,
      "on_arrival": "marble_arrives",
      "is_above_vertices": true
    }
  } 
```

### Defining the custom functions

All the custom functions are all added with `GraphFellow.add_function()`. It's
essential that the names in the config (JSON) matches the name with which the
functions are added.

The travellers in this graph could have been given a `journey_lifespan` of `6`,
which would automatically destroy each marble when it got to the bottom of the
graph (an inevitably 6 journeys from the top). But the config doesn't specify
that, so it defaults to 0 (immortal). Instead the `on_arrival` function
explicitly tests for the marble's sixth journey (see `marble_arrives` below).

For clarity, some constants, including six colours for the marbles:

```javascript
const max_cascade_depth = 6;
const start_vertex_id = "00";
const rainbow_colors = [0xee4035, 0xf37736, 0xfdf498, 0x7bc043, 0x0392cf, 0x4b0082];
```

The first function creates a new traveller (a marble). Marbles _always_ start
at the top vertex, which has the id `00`. The vertex pulses when the marble is
created — blue if this is a result of the regular tick, but green if the user
has actively dropped a marble by clicking on the vertex. Each time a marble is
dropped on the top node, the vertex's payload (counting the number of marbles)
is incremented using `payload.set()`, which updates the value _and_ its display.


The marbles make their left-right decision using the
`GraphVertex.get_random_edge_out()` method. On this graph, every vertex has
exactly two edges out (except the bottom row, which has none), so
`get_random_edge_out()` is always choosing either left of right. The
settings passed into `create_traveller` override the defaults set in the
graph's JSON config (for example, the `fill_color`). The payload value
of the top node increments every time you drop a new marble, so it's being
used to cycle through the colour each marble is created with:

```javascript
  GraphFellow.add_function("drop_new_marble", function(event, graph){
    let v = graph.get_vertex_by_id(start_vertex_id);
    v.pulse(event.type === 'tick'? 0x0000ff:0x00ff00); // green for tap/click
    graph.create_traveller({
       "at_vertex": v, 
       "fill_color": rainbow_colors[ v.payload.value % rainbow_colors.length]
    }).travel(v.get_random_edge_out());
    v.payload.set(v.payload.value+1);
  });
```

Each marble's `on_arrival` method increments the payload of the vertex it is
passing through. If it's reached the last row, the vertex is pulsed, and the
marble self-destructs by calling its own `destroy()` method.

```javascript
GraphFellow.add_function("marble_arrives", function(event, graph){
  this.at_vertex.payload.set(this.at_vertex.payload.value+1);
  if (this.qty_journeys < max_cascade_depth) {
    this.travel(this.at_vertex.get_random_edge_out());
  } else {
    this.at_vertex.pulse();
    this.destroy(); // alternatively, config could set journey_lifespan: 6
  }
});
```

### All done: create the graph

Finally, the graph is initialised by an explicit call to `init()`:

```javascript
GraphFellow.init();
```

This finds the container with class `graphfellow`, reads the JSON linked by the
`data-graph-src` attribute it find there, and initialises the graph. There's no
`on_init` function to run, but — because the `tick_period` is not zero — the
`on_tick` function will be called a little over 2 seconds later, and marbles
will start to drop.
