---
title: GraphFellow behaviour (functions)
layout: default
---

_beta: GraphFellow is still in development!_

* [quick start](index)
* [examples](examples)
* [settings & config](settings)
* [programming graph behaviour](behaviour)

# Programming graph behaviour


The behaviour of the graph is controlled by named JavaScript functions. There
are a few already available, but you can also write your own, and add them to
the graph with the `add_function` function.

The functions which control the behaviour of the graph are triggered by the following events:

| event type  | on        | description          
|-------------+-----------|-----------------------------
| `on_init`   | graph     | runs when the graph is initialised 
| `on_tick`   | graph     | runs every 'tick', if `tick_period` is not zero 
| `on_arrival`| traveller | run by a traveller when it arrives at the end of its journey along an edge
| `on_click`  | vertex, edge, traveller | runs when user clicks on component
| `on_mouseover` | vertex, edge, traveller | runs when user's mouse pointer moves over component

The function is called with two arguments: `event` and `graph`. You can also
use the `this` keyword to access the specific component that triggered the
event (for `init` and `tick` events, `this` is the graph).

Use `event.type` to determine what triggered the function. The `graph` object provides access to the [whole graph](#the-graph-object).

Be aware that `on_mouseover` events might never be triggered on pointerless
devices (e.g., tablets).

## Built-in functions

_Still in development!_ These are likely to change:

| function    | description
|-------------+--------------
| `_vertex_transmit_to_random` | creates and despatches a traveller to travel away from `this` vertex along an edge chosen at random 
| `_vertex_transmit_to_all` | creates and despatches a traveller along every edge out of `this` vertex
| `_print_payload` | (for debugging) prints the payload value for `this`
| `_pulse` | animate a pulse on `this`
| `_send_travellers_on_all_random` | executes `_vertex_transmit_to_random` on every vertex
| `_transmit_from_all_vertices_random` | executes `_vertex_transmit_to_all` on every vertex
| `_traveller_deliver_max_payload` | sets the payload of the vertex `this` traveller's current `at_vertex` to be the traveller's payload, if it's greater

### Adding your own functions

After the `GraphFellow` library has been loaded, use `add_function()` to make
your own function available.

```javascript
GraphFellow.add_function("alert_payload", function(event, graph){
  alert("I am one of the " + this.json_type + " with payload " + this.payload.value);
});
```

Then, in your config, do something like this to have this event triggered by
clicking on any vertex or traveller:

```javascript
"config": {
  "vertices": {"on_click": "alert_payload"},
  "travellers": {"on_click": "alert_payload"}
}

```

Note: `add_function()` will not let you add a function with a name that starts
with an underscore, because those are reserved for the built-ins.


## Component objects

Depending on what triggered the event you're programming, `this` may be a
`GraphVertex`, `GraphEdge`, or `Traveller` object. The following overview is a
jumping-off place for working with these objects — if you need to get deeply
familiar with them, look in the `graphfellow.js` source.

These fields are common to _all_ component types

| field            | description
|------------------+----------------------------
| `.json_type`     | use `this.json_type` to determine what type of thing it is — this returns a string with a value one of `vertices`, `edges` or `travellers` (yes, the type is given as a plural — see the [graph object](#the-graph-object))
| `.diagram`        | the visual representation of the object on the graph — it's a [PIXI.DisplayObject](https://pixijs.download/dev/docs/PIXI.DisplayObject.html). For example, the `.position` of that gives the (before-scaling) coordinates on the graph (which by default is 1000 wide — see `graph.config.grid_width` to check).
| `.payload`       | the payload (which includes a `diagram` and a `value`)
| `.payload.value` | payload value

Always use `payload.set(value)` to set the value, because this updates the diagram too.


### The `GraphVertex` object

Useful fields:

| field            | description
|------------------+----------------------------
| `.id`             | the unique ID for this vertex
| `.payload.value` | payload value
| `.edges_out`     | array of edges (`GraphEdge` objects) going out from this vertex
| `.edges_in`      | array of edges coming into this vertex

This vertex might not be the `from` vertex of an edge you find in the
`edges_out` array if that edge is bi-directional — if it isn't, it will be the
`to` vertex (and, similarly, be attentive with bi-directional edges in
`edges_in`).

The `GraphVertex` object has a `pulse(color)` function that you can use to make it pulse (if the vertex has not been configured with `has_pulse` then this
function has no effect).


### The `GraphEdge` object

Useful fields:

| field               | description
|---------------------+----------------------------
| `.from`             | the vertex (`GraphVertex` object) from which this edge starts
| `.to`               | the vertex at which this edge ends
| `.is_bidirectional` | `true` if travellers can traverse this edge both ways, in which case: be careful about what you infer from `from` and `to`

### The `Traveller` object

Useful fields:

| field                | description
|----------------------+----------------------------
| `.from`              | the vertex (`GraphVertex` object) from which this traveller started its journey (`null` if it is not travelling)
| `.to`                | the vertex at which this traveller ended (or will end) its journey (`null` if it is not travelling)
| `.following_edge`    | the edge (`GraphEdge` object) that this traveller is following (`null` if it is not travelling)
| `.at_vertex`         | the vertex at which this traveller is currently resting (or at which it has just arrvied — see note below)

The `from`, `to`, and `following_edge` fields are cleared _after_ the
traveller's `on_arrival` event is fired. The `at_vertex` field is populated
just before the `on_arrival` event — so all those fields are useful to you when
programming `on_arrival` functions.

The `Traveller` object has a `travel(edge)` function, which you can use to set
a traveller on its journey. Make sure the traveller's `at_vertex` is indeed one
`from` end of the `edge` you provide as an argument (or either of the ends if
the edge is bi-directional). 

To programmatically create a traveller, use its constructor (which takes a config which _must_ include an `at_vertex`, and the graph to which it belongs).
Currently you need to explictly add the `diagram` to the stage, and push it onto
the graph's `travellers` array (TODO: this is probably going to change!):

```javascript
  let t = new Traveller({
    "at_vertex": graph.get_vertex_by_id("foo"), 
    "journey_lifespan": 1
  }, graph);
  t.add_diagram(graph.app.stage);
  graph.travellers.push(t);
```

You can destroy a traveller with its `destroy()` function. This is called
automatically if the number of journeys the traveller makes equals its
`journey_lifespan`, after the `on_arrival` event of its final journey has been
executed.


## The `Graph` object

All the event handlers are called with two arguments, `event` and `graph`. The `graph` object gives you access to all the components in the graph.

Useful fields:

| field            | description
|------------------+----------------------------
| `.vertices`      | array of all vertices
| `.edges`         | array of all edges
| `.travellers`    | array of all travellers
| `.config`        | the current config settings (see [settings](settings) for detail)
| `.container`     | the DOM element containing the graph

For example, you can pulse all vertices red:

```javascript
for (let i=0; i < graph.vertices.length; i++) {
  graph.vertices[i].pulse(0xff0000);
}
```

Use `graph.get_vertex_by_id(id)` to find a vertex by its (string) id.

The names of the arrays of components correspond to what you find by inspecting a component's `json_type` field. This may be useful if you're writing event handlers that are generic because you can use a construction like:

```javascript
// this may be a vertex, edge, or traveller
let number_of_similar_items_in_graph = graph[this.json_type].length
```

## Creating graphs explicitly

### `GraphFellow.create_graph`

If you load `graphfellow.js` after your DOM is complete, it will automatically
populate any elements (presumably `<div>`s) with class `graphfellow`, provided
they have a `data-graph-src` attribute. But if you can't use that mechanism,
you can initialise graphs programmatically. This may be more convenient if you
want to specify the config as a JavaScript object in the page, rather than
loading it, via AJAX, as a separate JSON file.

`GraphFellow.create_graph(container, initial_config)` creates the graph:

| argument       | meaning
|----------------+---------------------
| container      | an HTML element from the DOM into which the graph will be inserted (typically a `<div>`), e.g., `document.getElementById("foo")`
| initial_config | an object containing a complete [config](settings) for the graph — if `null`, GraphFellow will check for a `data-graph-src` attribute on the container and use that if it's available



  
  
  


