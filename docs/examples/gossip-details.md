---
title: "GraphFellow example: gossip protocol"
layout: default
---

_beta: GraphFellow is still in development!_

# GraphFellow example: gossip protocol

* [quick start](../index)
* [more examples](../examples)
* [HTML for graphs](../html)
* [settings & config](../settings)
* [programming graph behaviour](../behaviour)

<style>
  .graphfellow canvas {
    top:0;
    left:0;
  }  
 .regexp-strings {
   min-height: 3em;
 }
 .regexp-strings span {
    padding:0.5em;
    margin:0.2em; 
    background-color: #ff0000;
    color: #ffffff;
    border-radius: 4px;
    font-weight: bold;
    display: inline-block;
  }
  #regexp-current span {
    background-color: #666666;
  }
  #regexp-current:before {
    content: "current:";
  }
  #regexp-accepted:before {
    content: "accepted:";
  }
  label {
    padding:0.5em;
    display:inline-block;
  }
  </style>
<script src="../../vendor/pixi.min.js"></script>
<script src="../../vendor/greensock-js/TweenMax.min.js"></script>

This diagram demonstrates the [gossip protocol](https://en.wikipedia.org/wiki/Gossip_protocol),
which is one of many ways nodes can propagate information across a network. This one is
sharing the highest value. Each node transmits its value and absorbs any higher value it
receives. The highest value on the network is shown in red as it spreads.

The gossip is transmitted randomly, but you can click on a node to force it.

[Just show the graph →](gossip)

<button id="gossip-reset">reset</button>

<div id="gossip-example" data-graph-src="gossip-protocol.json"></div>
<label><input type="checkbox" id="is-transmitting-all" class="gossip-settings"/>transmit to all neighbours</label>
<label><input type="checkbox" id="is-tracking-max-value" class="gossip-settings"/>show max value in red</label>
<label><input type="checkbox" id="is-using-unqiue-values"  checked="true" class="gossip-settings"/>unique values at start</label>
<label class="gossip-settings">
  transmit
<select id="transmit-freq">
  <option value="0.100">frequently</option>
  <option value="0.020" selected="true">moderately</option>
  <option value="0.005">rarely</option>
  <option value="0.000">never</option>
</select>
<label>click node to transmit</label>

<script src="../../graphfellow.js"></script>
<script>
  
  // when transmitting gossip, send on one edge
  // or all or all edges?
  // (always sends on all when user clicks on a vertex)
  let is_transmitting_all = false;
  
  // probablility that a node will transmit gossip,
  // tested every tick
  let p_transmit_this_tick =  0.02;
  
  // when populating the network at the start, should
  // all values be unique (otherwise duplicates may occur)?
  let is_using_unique_values = true;

  // if graph is tracking max value, max value is shown in red
  // (nodes themselves can't really know it's max, so it's artificial)
  let is_tracking_max_value = false;
  
  // once a vertex has transmitted, wait this long (ms)
  // before trying again
  let min_time_between_transmissions = 3001;
  
  // track max value, to display it differently
  let max_payload_in_graph = 0;

  const max_value_traveller_color = 0xcc0000,
        max_value_pulse_color = 0xff9999;
  
  function make_traveller(at_vertex, graph) {
    let v = at_vertex.payload.value;
    let t_config = {at_vertex: at_vertex};
    if ( is_tracking_max_value && v === max_payload_in_graph ) {
      t_config.fill_color = max_value_traveller_color;
    }
    return graph.create_traveller(t_config);
  }

  GraphFellow.add_function("randomly_assign_payloads", function(e, graph){
    while (graph.travellers.length > 0) {
      graph.travellers[0].destroy();
    }
    for (let i=0; i < graph.vertices.length; i++) {
      graph.vertices[i].stop_pulse();
    }
    max_payload_in_graph = 0;
    let values = new Array(graph.vertices.length);
    for (let i=0; i < values.length; i++) {
      values[i] = 1 + (is_using_unique_values? i : Math.floor(Math.random()*values.length));
      if (values[i] > max_payload_in_graph) {
        max_payload_in_graph = values[i];
      }
    }
    // shuffle code from
    // https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array#6274398
    let c = values.length;
    while (c > 0) {
      let i = Math.floor(Math.random() * c);
        c--;
        let temp = values[c];
        values[c] = values[i];
        values[i] = temp;
    }
    let now = new Date();
    for (let i=0; i<graph.vertices.length; i++) {
      graph.vertices[i].payload.set(values[i]);
      graph.vertices[i].custom_timestamp = now;
    }
  });

  GraphFellow.add_function("take_payload_from_vertex", function(e, graph){
    this.payload.set(this.at_vertex.payload.value);
  });

  GraphFellow.add_function("give_payload_to_vertex", function(e, graph){
    if (this.at_vertex.payload.value < this.payload.value) {
      this.at_vertex.payload.set(this.payload.value);
      let pulse_color = null;
      if (is_tracking_max_value && this.payload.value === max_payload_in_graph) {
        pulse_color =  max_value_pulse_color;
      }
      this.at_vertex.pulse(pulse_color);
    }
  });
  
  GraphFellow.add_function("transmit_gossip_from_vertex", function(e, graph){
    if (this.json_type === 'vertices' && this.edges_out.length > 0) {
      for (let i=0; i < this.edges_out.length; i++) {
        make_traveller(this, graph).travel(this.edges_out[i]);
      }
    }
  });

  GraphFellow.add_function("selectively_transmit_gossip_from_vertices", function(e, graph){
    let now = new Date();
    for (let i=0; i<graph.vertices.length; i++) {
      if ( Math.random() < p_transmit_this_tick
        &&
        (now - graph.vertices[i].custom_timestamp) > min_time_between_transmissions) {
          graph.vertices[i].custom_timestamp = now;
        let edges_to_follow = [];
        if (is_transmitting_all) {
          edges_to_follow = graph.vertices[i].edges_out;
        } else {
          edges_to_follow.push(graph.vertices[i].get_random_edge_out());
        }
        for (let j=0; j < edges_to_follow.length; j++) {
          let t = make_traveller(graph.vertices[i], graph);
          t.travel(edges_to_follow[j]);
        }
      }
    }
  });

  GraphFellow.init(document.getElementById("gossip-example"));

  document.getElementById("gossip-reset")
  .addEventListener("click", function(){
    GraphFellow.call_function(GraphFellow.graphs[0], "randomly_assign_payloads");
  });

  document.getElementById("is-transmitting-all")
    .addEventListener("click", function(){is_transmitting_all = this.checked});
  document.getElementById("is-tracking-max-value")
    .addEventListener("click", function(){is_tracking_max_value = this.checked});
  document.getElementById("is-using-unqiue-values")
    .addEventListener("click", function(){is_using_unique_values = this.checked});
  document.getElementById("transmit-freq")
    .addEventListener("change", function(){p_transmit_this_tick = this.value});
  
</script>

<hr style="margin-bottom:4em"/>

## Behind the scenes

The gossip protocol uses the `on_init` event to set up the network graph when
the graph is first rendered, and also when the reset button is clicked.

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
<div id="gossip-example" data-graph-src="gossip-protocol.json"></div>
```

Before defining custom functions, the GraphFellow library itself is loaded:

```html
<script src="../../graphfellow.js"></script>
```

### Config in the JSON

As the `data-graph-src` attribute shows, the graph is defined in
[`gossip-protocol.json`](gossip-protocol.json). You can click on that and
inspect the whole file, but the rest of this page describes the JSON
piece-by-piece.

The graph is initialised by calling `create_graph()` after the event handling
functions have been defined (see [`gossip-protocol.json`](gossip-protocol.json)
for the whole file):

```javascript
  "vertices": [
    {"id": "A", "x": 100, "y": 100 },
    {"id": "B", "x": 220, "y": 230 },
    {"id": "C", "x": 400, "y": 200 },
    ...
    ...
    {"id": "S", "x": 930, "y": 540 },
    {"id": "T", "x": 800, "y": 430 },
    {"id": "U", "x": 900, "y": 130 }
  ],
  "edges": [
    {"from": "A", "to": "B"},
    {"from": "B", "to": "C"},
    {"from": "C", "to": "D"},
    ...
    ...
    {"from": "Q", "to": "T"},
    {"from": "T", "to": "S"},
    {"from": "R", "to": "S"},
    {"from": "P", "to": "U"}
  ],
```

There are no travellers defined in the config, because they are created (and
destroyed) whenever a node decides to transmit — see functions described below.

By default, GraphFellow graphs are defined on a 1000 x 1000 grid. This gossip
demo is not square, so the `grid_height` of the grid is truncated at 660.
GraphFellow uses this (or the alternative `aspect_ratio` setting) to determine
the scaled dimensions when it sacles and renders the graph to fit on your page.

The graph is populated by the `on_init` function, It makes a decision as to
which nodes should transmit by randomly deciding for each one every "tick". So
the config defines the tick period (in seconds), and provides a function to run
on the `on_tick` event that the graph triggers every fifth of a second:


```javascript
"config": {
  "grid_height": 660,
  "on_init": "randomly_assign_payloads",
  "tick_period": 0.2,
  "on_tick": "selectively_transmit_gossip_from_vertices",
  ...
```
Config for all vertices includes setting the `on_click` event handler, which
allows you to exlicitly trigger transmission. This config also forces
the graph to start with empty payloads in all the vertices:

```javascript
"vertices": {
  "on_click": "transmit_gossip_from_vertex"
  "payload": "",
  "has_id_as_payload": false,
  "radius": 30,
  "text_font_size": 28,
  "text_color": "0xffffff",
  "stroke_width": 4,
  "fill_color": "0x000033",
  "stroke_color": "0x9999ff",
  "pulse_color": "0xeeeeff",
  "is_pulse_blur": true,
  "is_pulse_yoyo": true,
},
```

The config for the edges is straightforward. Every journey time takes
2 seconds, which means a traveller will get from start to end in the same
time regardless of how long the edge is. If you want to correc this, you
can set the journey time for individual journeys to override the global
value set here:

```javascript
"edges": {
  "stroke_color": "0xccccff",
  "traveller_radius": 6,
  "journey_duration": 2,
  "is_arrow": false,
  "is_bidirectional": true
},
```

The travellers in this graph have a `journey_lifespan` of `1`, which means
they are destroyed after a single journey. This is important: when a vertex
transmits its payload across the network, it does so by creating one or more
travellers that will carry that value one hop and then expire.

The `on_departure` and `on_arrival` event handlers are used to carry the value
of the payload from node to node (vertex to vertex). See below for the
functions themselves.

```javascript
"travellers": {
  "journey_lifespan": 1,
  "fill_color": "0x6666ff",
  "text_color": "0xffffff",
  "stroke_color": "0x9999ff",
  "radius": 18,
  "payload": 0,
  "is_displaying_payload": true,
  "is_above_vertices": false,
  "on_departure": "take_payload_from_vertex",
  "on_arrival": "give_payload_to_vertex"
}
```

### Defining the custom functions

All the custom functions are all added with `GraphFellow.add_function()`. It's
essential that the names in the config (JSON) matches the name with which the
functions are added.

The named functions are effectively hooks that (text-based) JSON can reference.
This example also includes eternal functions that those named functions themselves
call.

First set up some globals (some of these may be available for you to change via
controls in the HTML):

```javascript

// when transmiting gossip, send on one edge
// or all or all edges?
// (always sends on all when user clicks on a vertex)
let is_transmitting_all = false;

// probablility that a node will transmit gossip,
// tested every tick
let p_transmit_this_tick = 0.02;

// when populating the network at the start, should
// all values be unique (otherwise duplicates may occur)?
let is_using_unique_values = true;

// once a vertex has transmitted, wait this long (ms)
// before trying again
let min_time_between_transmissions = 3001;

// track max value, to display it differently
let max_payload_in_graph = 0;

const max_value_traveller_color = 0xcc0000,
      max_value_pulse_color = 0xff9999;
```

Next, a `make_traveller` function that sets the colour of the traveller
to red if it's about to set off from a vertex that already has a
maximum value on the network (this is to make it easier to see them spread).
Note how the `graph` object is being passed in as an argument, which provides
access to the `create_traveller()`.

```javascript
function make_traveller(at_vertex, graph) {
  let v = at_vertex.payload.value;
  let t_config = {at_vertex: at_vertex};
  if ( v === max_payload_in_graph) {
    t_config.fill_color = max_value_traveller_color;
  }
  return graph.create_traveller(t_config);
}
```

The `randomly_assign_payloads` is the most complex of the functions for
this graph, but that's mainly because it's been written to allow the **reset**
button to call this.

Note that calling `destroy()` on elements within the `travellers` array does
remove them from the array, hence the use of `while` to remove them.

The set-up of the payload value depends on the setting of `is_using_unique_values`.
The values themselves are in the range of `1` to _n_, where _n_ is the number
of nodes.

The payloads themsleves are set using the `payload.set()` method, because this
renders the diagram correctly — just setting the `payload.value` will not do this.

The `custom_timestamp` field being used on each vertex is not part of GraphFellow.
It's used to enforce a gap between transmissions from the same node. 

```javascript
GraphFellow.add_function("randomly_assign_payloads", function(e, graph){
  while (graph.travellers.length > 0) {
    graph.travellers[0].destroy();
  }
  max_payload_in_graph = 0;
  let values = new Array(graph.vertices.length);
  for (let i=0; i < values.length; i++) {
    values[i] = 1 + (is_using_unique_values? i : Math.floor(Math.random()*values.length));
    if (values[i] > max_payload_in_graph) {
      max_payload_in_graph = values[i];
    }
  }
  // shuffle code from
  // https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array#6274398
  let c = values.length;
  while (c > 0) {
    let i = Math.floor(Math.random() * c);
      c--;
      let temp = values[c];
      values[c] = values[i];
      values[i] = temp;
  }
  let now = new Date();
  for (let i=0; i < graph.vertices.length; i++) {
    graph.vertices[i].payload.set(values[i]);
    graph.vertices[i].custom_timestamp = now;
  }
});
```
The next two functions are the `on_departure` and `on_arrival` event handlers that
are applied to ever traveller. The first sets the traveller's payload at the start
of its journey, and the second passes it on to the node (vertex) it's arrived at,
assuming that it is of higher value than the vertex's current payload. The vertex
will pulse if the value is set. The colour of the pulse is normally defined by
the config, but by passing in a non-`null` argument, its colour can be overridden.

```javascript
  GraphFellow.add_function("take_payload_from_vertex", function(e, graph){
    this.payload.set(this.at_vertex.payload.value);
  });

  GraphFellow.add_function("give_payload_to_vertex", function(e, graph){
    if (this.payload.value > this.at_vertex.payload.value) {
      this.at_vertex.payload.set(this.payload.value);
      let color = this.payload.value === max_payload_in_graph? max_value_pulse_color : null;
      this.at_vertex.pulse(color);
    }
  });
```

The `transmit_gossip_from_vertex` function is the `on_click` handler for the vertices.
When you click on a vertex, it will transmit to all its neighbours.

```javascript
GraphFellow.add_function("transmit_gossip_from_vertex", function(e, graph){
  if (this.json_type === 'vertices' && this.edges_out.length > 0) {
    for (let i=0; i < this.edges_out.length; i++) {
      make_traveller(this, graph).travel(this.edges_out[i]);
    }
  }
});
```

This is the `on_tick` handler — this runs every `tick_period` seconds (from the config,
that's `0.2`, or five time a second) and randmonly decides whether or not each vertex
will transmit this tick. This also takes into account the `custom_timestamp` to enforce
a gap between transmissions.

Note that the travellers are despatched with the `.travel(edge)` method:

```javascript
GraphFellow.add_function("selectively_transmit_gossip_from_vertices", function(e, graph){
  let now = new Date();
  for (let i=0; i < graph.vertices.length; i++) {
    if ( Math.random() < p_transmit_this_tick &&
      (now - graph.vertices[i].custom_timestamp) > min_time_between_transmissions ) 
    {
      graph.vertices[i].custom_timestamp = now;
      let edges_to_follow = [];
      if (is_transmitting_all) {
        edges_to_follow = graph.vertices[i].edges_out;
      } else {
        edges_to_follow.push(graph.vertices[i].get_random_edge_out());
      }
      for (let j=0; j < edges_to_follow.length; j++) {
        let t = make_traveller(graph.vertices[i], graph);
        t.travel(edges_to_follow[j]);
      }
    }
  }
});
```

The **reset** button is wired to call the `randomly_assign_payloads` function, which
is also the graph's `on_init` function. The `GraphFellow.call_function()` method is used
to run named functions (that is, those that were added with `GraphFellow.add_function`),
but you must provide the caller — in this case the graph itself — as the first argument:

```javascript
document.getElementById("gossip-reset")
.addEventListener("click", function(){
  GraphFellow.call_function(
    GraphFellow.graphs[0],
    "randomly_assign_payloads"
  )
});
```


### All done: create the graph

Finally, the graph is initialised by an explicit call to `create_graph()`:

```javascript
GraphFellow.create_graph(document.getElementById("gossip-example"));
```

If the graph's container had a class of `graphfellow`, it would be possible to
simply use `GraphFellow.init()` instead. The primary advantage of using
`create_graph` is that it allows you to directly specify the container to
populate, and, optionally, define its config as a JavaScript object. In this
example, as the JSON is defined in the `data-graph-src` attribute,
`create_graph` is being used just to target the container.
