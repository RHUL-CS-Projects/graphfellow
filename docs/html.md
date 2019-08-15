---
title: GraphFellow HTML
layout: default
---

_beta: GraphFellow is still in development!_

* [quick start](index)
* [examples](examples)
* HTML for graphs
* [settings & config](settings)
* [programming graph behaviour](behaviour)

# HTML for GraphFellow's container

GraphFellow needs a container — typically that will be a `<div>` element — in
which to draw the graph. You should control the size (dimensions and aspect
ratio) of that container using CSS (see examples below).

The rest of this page is about this container. To define the graph itself,
you must describe its layout and appearance either via a JSON file, or as a
JavaScript object: see the [settings & config docs](settings) for (lots of)
details.

GraphFellow assumes that you've described your graph using a 1000 × 1000 grid
(unless you changed the `grid_width` setting). Whatever the size of that grid,
you graph will always fit inside the container because GraphFellow **scales
your graph to fit**. This scaling is (currently) width-based, so if you have a
tall skinny graph, it might get cropped if your container isn't tall enough.

> Remember that you need to include the libraries and `graphfellow.js` before
> anything will work — see [quick start](index).

## Identifying the container

The simplest way is to make a `<div>` with class `graphfellow`, because that's
the default:
  
```html
<style>
  .graphfellow {
    width: 500px;
    height: 500px;
  }
</style>
```

```html
<div class="graphfellow" data-graph-src="example.json"></div>
<script>
  GraphFellow.init() // finds any containers with class=graphfellow
</script>
```

If you want more control over what's going on, you can find the container(s)
yourself, and pass them as the argument to `GraphFellow.init()`.

```html
<style>
  #my-graph {
    width: 20em;
    height: 10em;
  }
</style>
```

```html
<div id="my-graph" data-graph-src="example.json"></div>
<script>
  GraphFellow.init(document.getElementById("my-graph"));
</script>
```

If you pass an array of containers, each one will be rendered.

### Config in a JSON file

GraphFellow's `init()` method requires that every container _must_ have a
`data-graph-src` attribute that links to a JSON file containing the graph's
config.

```html
<div data-graph-src='path/to/your/config-file.json' id="foo"></div>
```

The `GraphFellow.init()` method (with an optional `containers` argument) will
read the contents of that JSON file and render the graph.

| argument       | value
|----------------+---------------------
| `containers`     | (optional) an HTML element from the DOM (or, for multiple graphs, an array of such elements) into which the graph will be inserted (typically a `<div>`). If no containers are provided, `init()` will automatically find and attempt to populate all elements with class `graphfellow`.

If your container doesn't have a `data-graph-src` attribute, or the JSON file
can't be found, or the JSON can't be parsed, then no graph will appear.

### Config as a JavaScript object

If you prefer to define your config in JavaScript (or even fetch and parse the
JSON yourself), you can pass in a container together with its config:
```html
<div id="foo"></div>
```
```javascript
var config = { 
  vertices: [
    {id: "A", x: "500", y: "500"}
    // more vertices...
  ]
  // ...more config here...
};
var container = document.getElementById('foo');
GraphFellow.create_graph( container, config );

```

Note that this is using `GraphFellow.create_graph()` instead of `init()`.

`GraphFellow.create_graph(container, initial_config)` creates the graph:

| argument       | value
|----------------+---------------------
| `container`      | an HTML element from the DOM into which the graph will be inserted (typically a `<div>`), e.g., `document.getElementById("foo")`
| `initial_config` | (optional) an object containing a complete config for the graph. If `null`, GraphFellow will check for a `data-graph-src` attribute on the container and use that if it's available


## Example CSS

For a graph that fills the whole screen, try:

```html
<style>
  body,html {
    margin: 0;
    padding: 0;
  }
  .graphfellow {
    width: 100%;
    height: 100vh;
    overflow: hidden;
    box-sizing: border-box;
  }
</style>
```
```html
<div class="graphfellow" data-graph-src="example.json"></div>
```

For a fixed-size graph:
```html
<style>
  .graphfellow {
    width: 500px;
    height:300px;
    border:1px solid #999;
    box-sizing: border-box;
  }
</style>
```
```html
<div class="graphfellow" data-graph-src="example.json"></div>
```


## Overriding config in the HTML

The [settings & config docs](settings) are normally provided via JSON
or JavaScript, but it's also possible to pass some in via the HTML.

You can specifiy _some_ config in the `data-graph-config` attribute of the
container of your graph as a comma-separated list of name:value settings.
Settings in here have the highest priority: they will override the same
settings that you may have made anywhere else. This is mostly useful for
specifying the background colour. 

```html
<div class="graphfellow" data-graph-src="my-graph.json"
  data-graph-config="background-color:0xffccff,vertices.is-pulse-blur:true"></div>
```

GraphFellow is tolerant of you using hyphens or colons interchangeably in the
property names here.

You can set nested properties using `.`, such as `edges.stroke_color:0x00ff00`.

It's probably not a good idea to overuse this feature, and only use it for
specific overrides. You can't specify components here, only the `config`
settings, so this is not an alternative for defining a complete configuration
in JSON or JavaScript.


