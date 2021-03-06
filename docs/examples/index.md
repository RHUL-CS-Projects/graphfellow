---
title: "GraphFellow: directed graphs in JavaScript"
layout: default
---

_beta: GraphFellow is still in development!_

# Examples

<script src="../../vendor/pixi.min.js"></script>
<script src="../../vendor/greensock-js/TweenMax.min.js"></script> 
<style>
.graphfellow, .graph-container{
  max-width:92%;
  display:inline-block;
  position: relative;
  margin: 0 0.5em;
}
.graphfellow a {
  position: absolute;
  bottom: 0.5em;
  right: 0.25em;
  padding: 0.5em;
  border: 2px solid #ffffff;
  border-radius:0.25em;
  background-color: #cc0000;
  color: white;
  text-decoration: none;
}
.graphfellow a:hover {
  background-color: #660000;
}
.daisies {
  background-image: url(../img/daisies.jpg);
  background-size:cover;
}
</style> 

<div id="other" class="graph-container" data-graph-config="background-color:0xffffcc"></div>
<div class="graphfellow" data-graph-src="regexp.json" data-graph-config="grid_height:400"><a href="regexp">regexp →</a></div>
<div class="graphfellow" data-graph-src="gossip-protocol.json"><a href="gossip">gossip protocol →</a></div>
<div class="graphfellow" data-graph-src="graph-1.json"
data-graph-config="vertices.pulse-duration:1,vertices.is_pulse_blur:true,vertices.pulse_scale:3,vertices.is_pulse_yoyo:false,background-color:0xccffcc,travellers.fill-color:0xffffff,vertices.fill-color:0xffffcc,vertices.stroke_width:8,vertices.stroke_color:0x009900,edges.is-arrow:true"></div>
<div class="graphfellow" data-graph-src="galton.json" data-graph-config="grid_height:560"><a href="galton">Galton Board →</a></div>
<div class="graphfellow daisies" data-graph-src="bunny.json" data-graph-config="is-transparent:true,background-color:0x000000"></div>

<script src="../../graphfellow.js"></script>

<script>

// example config here is the same as example.json
// but demonstrating loading from a JavaScript object instread of
// via the data-graph-src AJAX call...
let example_config = {
    "vertices": [
      { "id": "A", "x": 200, "y": 225 },
      { "id": "B", "x": 800, "y": 225 },
      { "id": "C", "x": 800, "y": 775 },
      { "id": "D", "x": 200, "y": 775 }
    ],
    "edges": [
      { "from": "A", "to": "B"},
      { "from": "B", "to": "C"},
      { "from": "C", "to": "D"},
      { "from": "D", "to": "A"},
      { "from": "A", "to": "C", "is_bidirectional": true, "journey_duration": 1.4},
      { "from": "B", "to": "D", "is_bidirectional": true, "journey_duration": 1.4}
    ],
    "travellers": [
      {
        "at_vertex": "A", 
        "radius": 30,
        "on_arrival": "_pulse",
        "fill_color": "0xff0000",
        "stroke_color": "0xff0000"
      }
    ],
    "config": {
      "vertices": {
        "stroke_width": 8,
        "radius": 120,
        "text_font_size": 80,
        "has_pulse": true,
        "pulse_scale": 1.2,
        "is_pulse_blur": false
      },
      "edges": {
        "stroke_width": 8,
        "arrowhead_length": 40
      },
      "tick_period": 2,
      "on_tick": "_send_travellers_on_all_random"
    }
  }
;
GraphFellow.create_graph(document.getElementById("other"), example_config);

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

// for gossip-protocol

let is_transmitting_all = false;
let p_transmit_this_tick =  0.02;
let is_using_unique_values = true;
let is_tracking_max_value = true;
let min_time_between_transmissions = 3001;
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

// for Galton Board cascading marbles
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

GraphFellow.init(); // all graphs with class 'graphfellow' and data-graph-src

</script>
<p style="margin-top:2em"></p>

* [quick start](../index#quick-start)
* examples
* [HTML for graphs](../html)
* [settings & config](../settings)
* [programming graph behaviour](../behaviour)
