---
title: GraphFellow behaviour (functions)
layout: default
---

_beta: GraphFellow is still in development!_

* [quick start](index)
* [examples](examples)
* [HTML for graphs](html)
* [settings & config](settings)
* programming graph behaviour

# Programming graph behaviour


The behaviour of the graph is controlled by named JavaScript functions. There
are a few already available, but you can also write your own, and add them to
the graph with the `add_function` function.

You should make sure you add all the functions you need _before_ you initialise
your graphs with `GraphFellow.init()` or `GraphFellow.create_graph()`.

The functions which control the behaviour of the graph are triggered by the
following events:

| event type     | on        | description          
|----------------+-----------|-----------------------------
| `on_init`      | graph     | runs when the graph is initialised 
| `on_tick`      | graph     | runs every 'tick', if `tick_period` is not zero 
| `on_departure` | traveller | run by a traveller just before it sets off on a journey along an edge
| `on_arrival` | traveller | run by a traveller when it arrives at the end of its journey along an edge
| `on_click`     | vertex, edge, traveller | runs when user clicks or taps on component
| `on_mouseover` | vertex, edge, traveller | runs when user's pointer moves over component

The function is called with two arguments: `event` and `graph`. You can also
use the `this` keyword to access the specific component that triggered the
event (for `init` and `tick` events, `this` is the graph).

Use `event.type` to determine what triggered the function. The `graph` object
provides access to the [whole graph](#the-graph-object).

The `on_click` and `on_mouseover` events are triggered by `pointertap` and
`pointerover` events in the browser, so work with touch as well as mouse
interfaces.


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
  alert("I am a " + this.component_type + " with payload " + this.payload.value);
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
`GraphVertex`, `GraphEdge`, or `Traveller` (or sometimes [the `Graph` object](#the-graph-object)
itself). The following overview is a jumping-off place for working with these
objects — if you need to get deeply familiar with them, look in the
`graphfellow.js` source.

These fields are common to _all_ three component types:

| field             | description
|-------------------+----------------------------
| `.component_type` | use `this.component_type` to determine what type of thing it is — returns a string with a value one of `vertex`, `edge`, or `traveller` (or even `graph`)
| `.json_type`      | string with a value one of `vertices`, `edges` or `travellers`, matching the collection names in the [graph object](#the-graph-object)
| `.diagram`        | the visual representation of the object on the graph — it's a [PIXI.DisplayObject](https://pixijs.download/dev/docs/PIXI.DisplayObject.html). For example, the `.position` of that gives the (before-scaling) coordinates on the graph (which by default is 1000 wide — see `graph.config.grid_width` to check).
| `.payload`        | the payload (which includes a `diagram` and a `value`)
| `.payload.value`  | payload value

Always use `payload.set(value)` to set the value, because this updates the
diagram too.

### The GraphVertex object

Useful fields:

| field            | description
|------------------+----------------------------
| `.id`             | the unique ID for this vertex
| `.payload.value` | payload value
| `.edges_out`     | array of edges (`GraphEdge` objects) going out from this vertex
| `.edges_in`      | array of edges coming into this vertex

The order of edges in the `edges_out` array matches the order in which
they were declared in the config that was used to create the vertex (see `last`
in the `get_edge_to()` method below).

This vertex might not be the `from` vertex of an edge you find in the
`edges_out` array if that edge is bi-directional — if it isn't, it will be the
`to` vertex (and, similarly, be attentive with bi-directional edges in
`edges_in`).

You can select an edge out of a vertex using the vertex's
`get_edge_to(to_vertex, chooser)` method. The method effectively searches the
`edges_out` array for you and returns one edge that leads from the current to
vertex to the vertex specified by the `to_vertex` argument (a `GraphVertex`
object). The returned edge may be `null` if no such edge is available. The
optional `chooser` argument is a string indicating how that edge will be
selected if there is more than one available that leads to the `to_vertex`:

| chooser            | description
|--------------------+-------------------------------
| _none_             | the first edge found (the default), using the ordering of `edges_out` array
| `last`             | the last edge found, using the ordering of `edges_out` array
| `random`           | a random choice from all possible edges (made with equal distribution)

The method `get_random_edge_out()` will choose one of the edges from `edges_out`, without
consideration for which destination that is.

The `GraphVertex` object has a `pulse(color)` function that you can use to make
it pulse (if the vertex has not been configured with `has_pulse` then this
function has no effect).

### The GraphEdge object

Useful fields:

| field               | description
|---------------------+----------------------------
| `.from`             | the vertex (`GraphVertex` object) from which this edge starts
| `.to`               | the vertex at which this edge ends
| `.is_bidirectional` | `true` if travellers can traverse this edge both ways, in which case: be careful about what you infer from `from` and `to`

### The Traveller object

Useful fields:

| field                | description
|----------------------+----------------------------
| `.from`              | the vertex (`GraphVertex` object) from which this traveller started its journey (`null` if it is not travelling)
| `.to`                | the vertex at which this traveller ended (or will end) its journey (`null` if it is not travelling)
| `.following_edge`    | the edge (`GraphEdge` object) that this traveller is following (`null` if it is not travelling)
| `.at_vertex`         | the vertex at which this traveller is currently resting (or at which it has just arrvied — see note below)
| `.qty_journeys`      | count of journeys this traveller has completed (see below)

The `from`, `to`, and `following_edge` fields are set _before_ the traveller's
`on_departure` event, and cleared _after_ its `on_arrival` event. Additionally,
the `at_vertex` field is cleared after the `on_departure` event and populated
just before the `on_arrival` event — so all those fields are useful to you when
programming the traveller's journey-based event functions.

The `Traveller` object has a `travel(edge)` method, which you can use to set a
traveller on its journey. The journey will only happen if the traveller _can_
travel along that edge based on its current location. That is, the edge
specified must start from the traveller's `at_vertex` (which could be at either
end if the edge is bi-directional).

If the edge doesn't start from the traveller's current location, the call
will return `false`, and no journey is commenced.

Otherwise, `travel()` triggers the `on_departure` event if this traveller has
one defined, starts the animation, and returns `true`. Note that the duration
of the journey is determined by multiplying the edge's `journey_duration` (in
seconds) by the traveller's `speed`.

To programmatically create a traveller, use `Graph.create_traveller()`, which
takes a config object that _must_ include an `at_vertex` `GraphVertex` object,
and the graph to which it belongs). This automatically renders the diagram on
the stage and adds the traveller to the graph's `travellers` array.

```javascript
  let t = graph.create_traveller({
    "at_vertex": graph.get_vertex_by_id("foo"), 
    "journey_lifespan": 1
  });
```

The number of journeys a traveller has made is recorded in its `qty_journeys`
property. This is updated on arrival at a vertex, _before_ the `on_arrival`
function (if any) is called.

You can destroy a traveller with its `destroy()` function. This is called
automatically if the number of journeys the traveller has made equals its
`journey_lifespan`, after the `on_arrival` event of its final journey has been
executed. If you call `destroy()` on a traveller that is already on a journey,
it will be destroyed and its `on_arrival` event will not be triggered.

## Accessing the graph or graphs

The GraphFellow methods `init()` and `create_graph()` each return the graph
they create. In the case of `init()`, if there is more than one, you'll get an
array of graphs instead. Often you don't need this, but sometimes it's helpful
(for example, see how the reset button is implemented in the [regexp
example](examples/regexp-details)).

```html
<div class="graphfellow" data-graph-src="example.json"></div>
```
```javascript
let my_graph = GraphFellow.init(); // my_graph contains graph object
```

Note that you may get a graph object back from `init()` or `create_graph()`
before it is ready to use, because it still needs to load its config from the
JSON file linked from its container's `data-graph-src` attribute. You can check
the graph's `is_ready` attribute, which is `true` when config has loaded. If
you [provided config explicitly](html#config-as-a-javascript-object) with
`create_graph()` this will be `true` immediately. Otherwise, you may have to
wait for the AJAX call to complete. That call is automatically made as soon as
the graph is created (that is, you don't have to trigger it youself).

All graphs are added to the `GraphFellow.graphs` array in the order they are
created. For example, if there's only one graph on the page you can access it
with `GraphFellow.graphs[0]`.

## The Graph object

You might be accessing the `Graph` object via the result you got back when you
created it, or via `GraphFellow.graphs` (see above), or — more commonly — in an
event handler triggered from within the graph. All the event handlers are
called with two arguments, `event` and `graph`.

The `Graph` object gives you access to all the components in the graph.

Useful fields:

| field            | description
|------------------+----------------------------
| `.vertices`      | array of all vertices
| `.edges`         | array of all edges
| `.travellers`    | array of all travellers
| `.config`        | the current config settings (see [settings](settings) for detail)
| `.container`     | the DOM element containing the graph
| `.component_type`| returns the string with value "`graph`"
| `.json_type`     | returns the string with value "`graphs`"
| `.is_ready`      | set to `true` when configuration is complete, which might not be immediately upon creation if it's being loaded, via AJAX, from a JSON file 

For example, if `graph` is the `Graph` object, you can pulse all vertices red:

```javascript
for (let i=0; i < graph.vertices.length; i++) {
  graph.vertices[i].pulse(0xff0000);
}
```

Use `graph.get_vertex_by_id(id)` to find a vertex by its (string) id.

The names of the arrays of components correspond to what you find by inspecting
a component's `json_type` field. This may be useful if you're writing event
handlers that are generic, because you can use a construction like:

```javascript
// "this" may be a vertex, edge, or traveller
let number_of_similar_items_in_graph = graph[this.json_type].length
```

**Caution**: be careful when iterating over the graph's `travellers` array if
any of those travellers might be destroyed or created while you're doing it.
The `destroy()` method in particular can cause unexpected results, because the
indices of the array may change when a traveller is removed from it.

