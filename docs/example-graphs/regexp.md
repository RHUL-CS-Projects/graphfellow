---
title: GraphFellow example: regexp automata
layout: default
---

_beta: GraphFellow is still in development!_

# GraphFellow example: regexp automata
* [more examples](../examples)

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
  
  </style>
<script src="../../vendor/pixi.min.js"></script>
<script src="../../vendor/greensock-js/TweenMax.min.js"></script>

This finite state automata, representing a regular expression, has a start
state of `0` and two accepting states, `3` and `5`. Move the red spot through
it by clicking on the nodes or edges and see how the language "accepts" some
strings and not others.
<button id="regexp-reset">reset</button>


<div id="regexp-example"
  data-graph-src="cs1870_fa_8.2.json"
  data-graph-config="background-color:0xf2f2f2"
  style="width:100%;height: 300px;"></div>
<p class="regexp-strings" id="regexp-current"></p>
<p class="regexp-strings" id="regexp-accepted"></p>
<script src="../../graphfellow.js"></script>
<script>
  // functions for CS 1870 finite automata

  let current = document.getElementById("regexp-current")
  let accepted = document.getElementById("regexp-accepted");
  
  GraphFellow.add_function("spot_arrives_at_next_state", function(e, graph){
    if (this.following_edge.payload.value != "ε") {
      this.payload.set(this.payload.value + this.following_edge.payload.value);
    }
    this.at_vertex.pulse();
    if (current) {
      current.innerHTML = "<span>" + this.payload.value + "</span>";
    }
    if (this.at_vertex.has_ring) {
      if (accepted) {
        accepted.innerHTML = "<span>" + this.payload.value + "</span>" + accepted.innerHTML;
      }
    }
  });

  GraphFellow.add_function("send_traveller_to_node", function(e, graph){
    let t = graph.travellers[0]; // find the (only) traveller
    if (t && t.at_vertex) { // only if the traveller is at rest
      let possible_edges = [];
      if (this.json_type === 'edges') {
        if (this.from === t.at_vertex) {
          possible_edges.push(this);
        }
      } else if (this.json_type === 'vertices') {
        for (let i =0; i < t.at_vertex.edges_out.length; i++) {
          if (t.at_vertex.edges_out[i].to === this) {
            possible_edges.push(t.at_vertex.edges_out[i]);
          }
        }
      }
      if (possible_edges.length === 1) {
        t.travel(possible_edges[0]);
      }
    }
  });

  document.getElementById("regexp-reset")
    .addEventListener("click", function(){
    let g = GraphFellow.graphs[0];
    if (g) {
      g.travellers[0].destroy();
      g.create_traveller({at_vertex: "0"});
      current.innerHTML = accepted.innerHTML = "";
    }
  });

  GraphFellow.create_graph(document.getElementById("regexp-example"));
</script>

<hr style="margin-bottom:4em"/>

## Behind the scenes

This example — a finite state automata (FA) representing a specific regular
expression, or regexp — is a very specific one, because it was taken from the
course notes of the first-year Machine Fundamentals course in the Computer
Science degree taught at Royal Holloway (where this project was conceived).
Even if you don't know what a regexp or an FA is, there's a good chance that
you can work out how it operates just by _playing_ with the graph above...
which was, really, the motivation for creating GraphFellow in the first place.


### HTML setup

Like all the examples, this page starts by loading the libraries GraphFellow
needs:

```html
<script src="../../vendor/pixi.min.js"></script>
<script src="../../vendor/greensock-js/TweenMax.min.js"></script>
```

The regexp demo uses three DOM elements: the container for the graph itself, and a couple of `<p>` elements into which to write the strings. They're styled with CSS defined separately.


```html
<div id="regexp-example"
  data-graph-src="cs1870_fa_8.2.json"
  data-graph-config="background-color:0xf2f2f2"
  style="width:100%;height: 300px;"></div>
<p class="regexp-strings" id="regexp-current"></p>
<p class="regexp-strings" id="regexp-accepted"></p>
```

Before defining custom functions, the GraphFellow library itself is loaded:

```html
<script src="../../graphfellow.js"></script>
```

### Config in the JSON

As the `data-graph-src` attribute shows, the graph is defined in [`cs1870_fa_8.2.json`](cs1870_fa_8.2.json). You can click on that and inspect the whole file, but the rest of this page describes the JSON piece-by-piece.

The container `<div>` does _not_ have a class of `graphfellow`: this is to
prevent auto-initialising — instead, the graph will be explicitly initialised
by calling `create_graph()` after the event handling functions have been
defined.
  
The two vertices (`3` and `5`) representing accepting states pulse differently from the other states (their pulses are bigger, and red).

```javascript
"vertices": [
  {"id": "0", "x": 180, "y": 250},
  {"id": "1", "x": 60,  "y": 170},
  {"id": "2", "x": 300, "y": 250},
  {"id": "3", "x": 450, "y": 100, "has_ring": true, "pulse_color": "0xff0000", "pulse_duration": 1, "pulse_scale": 2},
  {"id": "4", "x": 450, "y": 250},
  {"id": "5", "x": 660, "y": 250, "has_ring": true, "pulse_color": "0xff0000", "pulse_duration": 1, "pulse_scale": 2},
  {"id": "6", "x": 850, "y": 180},
  {"id": "7", "x": 660, "y": 100}
]
```

The edges' payload values are important: these correspond to the characters that are added to the string when the traveller traverses them. The `payload_offset` settings are common on edges, because the default position of the payload is the middle of the edge, which for straight lines means it will intersect. Note two control points on the `6`-to-`6` loop: if you don't have
two, separated control points on an edge that starts and ends at the same vertex, you will not be able to see it.

```javascript
"edges": [
  {"from": "0", "to": "1", "payload": "a", "payload_offset_x": -10, "payload_offset_y":  30},
  {"from": "0", "to": "2", "payload": "b", "payload_offset_x":   0, "payload_offset_y":  25},
  {"from": "2", "to": "3", "payload": "ε", "payload_offset_x": -15, "payload_offset_y": -10},
  {"from": "2", "to": "4", "payload": "ε", "payload_offset_x":   0, "payload_offset_y": -20},
  {"from": "3", "to": "2", "payload": "b", "payload_offset_x": -40, "payload_offset_y": -30, "control_points": [{"x": -250, "y": 0}]},
  {"from": "3", "to": "5", "payload": "a", "payload_offset_x":  10, "payload_offset_y": -20},
  {"from": "3", "to": "7", "payload": "a", "payload_offset_x":   0, "payload_offset_y": -20},
  {"from": "4", "to": "3", "payload": "X", "payload_offset_x":  20, "payload_offset_y":   0},
  {"from": "5", "to": "4", "payload": "ε", "payload_offset_x":   0, "payload_offset_y": -20},
  {"from": "5", "to": "6", "payload": "X", "payload_offset_x":   0, "payload_offset_y":  20},
  {"from": "6", "to": "6", "payload": "b", "control_points": [{"x": 0, "y": 140}, {"x": 200, "y": 10}]},
  {"from": "6", "to": "7", "payload": "b", "payload_offset_x":   5, "payload_offset_y": -20},
  {"from": "7", "to": "5", "payload": "b", "payload_offset_x":  15, "payload_offset_y":   0}
]
```

This finite state automata works by moving a single, persistent traveller around the graph. So it's defined in the JSON config too, set at vertex `0` which is the start state of the automata:

```javascript
"travellers": [
  { "at_vertex": "0" }
]
```

The `on_arrival` function, defined below, is the key to how the automata works:
it adds the payload to accumulating string, and also handles it specially if
the state is an accepting state.

Finally the rest of the config describes more of the graph, and importantly
adds `on_click` handlers to _all_ of the edges and vertices:

```javascript
"config": {
  "text_font_size": 50,
  "vertices": {
    "radius": 30,
    "text_font_family": "serif",
    "text_font_size": 30,
    "ring_radius": 36,
    "on_click": "send_traveller_to_node",
    "pulse_color": "0x000000",
    "pulse_duration": 0.5,
    "is_pulse_blur": false,
    "is_pulse_yoyo": false,
    "pulse_scale": 1.25
  },
  "edges": {
    "is_displaying_payload": true,
    "text_font_family": "serif",
    "text_font_style": "italic",
    "text_font_size": 30,
    "on_click": "send_traveller_to_node"
  },
  "travellers": {
    "payload_value": "",
    "on_arrival": "spot_arrives_at_next_state",
    "is_above_vertices": true,
    "payload": "",
    "fill_color": "0xff0000"
  }
} 
```

Note that there is no `on_init` function here because all the setup has been
done in the config (for example, creating the one, persistent traveller).
There's no `tick_period` either, because all the behaviour is in response to
user interaction. By default, `tick_period` is `0`, so there's no `on_tick`
activity happening on this graph.

### Defining the custom functions

The user interaction is clicking on a node or an edge, both of which trigger
the same, custom function: `send_traveller_to_node`. This checks to see if the
edge or node that's been clicked can be traversed right now. If it can, the
traveller is sent on its journey along that edge. If it can't, nothing happens.

The click handler is added to GraphFellow's functions with `add_function()`.
Crucially, this is the same name (`send_traveller_to_node`) that appears in the
`on_click` settings in the graph's config (in the JSON):

```javascript
GraphFellow.add_function("send_traveller_to_node", function(e, graph){
  let t = graph.travellers[0]; // find the (only) traveller
  if (t && t.at_vertex) { // only if the traveller is at rest
    let possible_edges = [];
    if (this.json_type === 'edges') {
      if (this.from === t.at_vertex) {
        possible_edges.push(this);
      }
    } else if (this.json_type === 'vertices') {
      for (let i =0; i < t.at_vertex.edges_out.length; i++) {
        if (t.at_vertex.edges_out[i].to === this) {
          possible_edges.push(t.at_vertex.edges_out[i]);
        }
      }
    }
    if (possible_edges.length === 1) {
      t.travel(possible_edges[0]);
    }
  }
});
```

The only clicks we're interested in are to initiate a journey, so we can
dismiss any clicks that trigger the function if they occur when the traveller
is not on a node (that is, it is currently traversing an edge). That's what the
test at the start is for: `t.at_vertex` will be `null` if the traveller is not
at rest.

Next, `this.json_type` is used to determine what kind of component the `this`
keyword refers to, because this function is the `on_click` event handler for
both vertices and edges and each needs slightly different treatment.

Note that the function is not anticipating any edges being bi-directional, because finite state automata like this do not have such edges. But if the graph were to contain them, the logic would be a little more complicated:

```javascript
if (this.from === t.at_vertex || 
  (this.is_bidirectional && this.to === t.at_vertex ))
  possible_edges.push(this);
}
...
if (t.at_vertex.edges_out[i].to === this ||
  (t.at_vertex.edges_out[i].is_bidirectional
  && t.at_vertex.edges_out[i].from === this))
  ) {
  possible_edges.push(t.at_vertex.edges_out[i]);
}

```

That is, if you need to handle bi-directional edges, you need to check both ends of them because `to` and `from` might be the other way round.

The `possible_edges` array is anticipating there being more than `0` feasible
edges. If there are none, it's because the user clicked on an edge or a vertex
which the traveller can't get to from its current `at_vertex` position. That's
OK: just do nothing. Otherwise, there is at least one viable edge to follow in
response to the click. As it happens, this graph doesn't provide an opportunity
for it (because there's never more than one edge between any two vertices), but
by testing `possible_edges.length === 1`, this code will refuse to move the
traveller if there is a choice of route is ambiguous. (Presumably, in such a
case the user could click on one of the edges itself to disambiguate them).

Finally, the logic for building up the string as the traveller is guided around
the graph is handled by the `spot_arrives_at_next_state`. Remember this name is
from the traveller's `on_arrival` setting. This is what you might expect,
because the FA is really all about moving to new states (vertices):

```javascript
GraphFellow.add_function("spot_arrives_at_next_state", function(e, graph){
  if (this.following_edge.payload.value != "ε") {
    this.payload.set(this.payload.value + this.following_edge.payload.value);
  }
  this.at_vertex.pulse();
  if (current) {
    current.innerHTML = "<span>" + this.payload.value + "</span>";
  }
  if (this.at_vertex.has_ring) {
    if (accepted) {
      accepted.innerHTML = "<span>" + this.payload.value + "</span>" + accepted.innerHTML;
    }
  }
});
```

By definition, the epsilon (ε) transition in a finite automata is an
empty-string transition. Note that using `this.payload.set()` is recommended —
rather than manipulating the `this.payload.value` directly — because, if the
payload is being displayed, this would also update the diagram.

The `pulse()` function on the vertex will behave differently for accepting
states (vertices `3` and `5`) because the config defined those states' pulses
differently from the rest.

### Add a reset button

The example automata has a dead-end in it: if you go to state `1`, you can't get out. There are other reasons you might want to reset the graph anyway. The reset button is just a `<button>` element:

```html
<button id="regexp-reset">reset</button>
```

...with a click event handler added to it:

```javascript
document.getElementById("regexp-reset")
  .addEventListener("click", function(){
  let g = GraphFellow.graphs[0];
  if (g) {
    g.travellers[0].destroy();
    g.create_traveller({at_vertex: "0"});
    current.innerHTML = accepted.innerHTML = "";
  }
});
```

This deletes the traveller and replaces it with a new one at the start state (vertex `0`). The `destroy()` and `create_traveller()` functions handle rendering of the diagram, and manage the graph's `travellers` array too. 

The click handler also clears the two HTML elements that are displaying the current and accepted strings. Everything is ready to start again.

Note that when the config for the traveller was specified (in the JSON file),
the characteristics of the travellers were put in the `config.travellers{}`
section (and not as settings of the single traveller defined in the
`travellers` array). This ensures that all new travellers created inherit these
same settings, which happens when this reset method creates the new traveller.


### All done: create the graph

Finally, the graph is initialised by an explicit call to `create_graph()`. This
takes two arguments: the container into which the graph will be rendered, and a
config object. Because no config object is provided, GraphFellow will load the
config as a JSON file (that is, an AJAX call) defined in the `data-graph-src`
attribute found on the container:

```javascript
  GraphFellow.create_graph(document.getElementById("regexp-example"));
```

