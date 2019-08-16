---
title: "GraphFellow: directed graphs in JavaScript"
layout: default
---

_beta: GraphFellow is still in development!_

# GraphFellow

Animated, interactive directed graphs in JavaScript

[quick start](docs/) |
[examples](docs/examples) |
[HTML for graphs](docs/html) |
[settings & config](docs/settings) |
[programming&nbsp;graph&nbsp;behaviour](docs/behaviour)

---

This finite state automata, representing a regular expression, has a start
state of `0` and two accepting states, `3` and `5`. Move the red spot through
it by clicking on the nodes or edges and see how the language "accepts" some
strings and not others.
<button id="regexp-reset">reset</button>

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
<script src="vendor/pixi.min.js"></script>
<script src="vendor/greensock-js/TweenMax.min.js"></script>
<div id="regexp-example"
  data-graph-src="docs/examples/regexp.json"
  data-graph-config="background-color:0xf2f2f2"
  style="width:100%;height: 300px;"></div>
<p class="regexp-strings" id="regexp-current"></p>
<p class="regexp-strings" id="regexp-accepted"></p>
<script src="graphfellow.js"></script>
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
      if (this.component_type === 'edge') {
        if (this.from === t.at_vertex) {
          possible_edges.push(this);
        }
      } else if (this.component_type === 'vertex') {
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
  
  document.getElementById("regexp-reset").addEventListener("click", function(){
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

[See how this example was implemented](docs/examples/regexp)
