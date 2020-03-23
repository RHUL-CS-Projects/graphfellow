(function( GraphFellow, undefined ) {
  GraphFellow.graphs = [];

  const WHITE = 0xffffff;
  const BLACK = 0x000000;
  const RED   = 0xff0000;

  let default_config = {
    "antialias":             true,
    "grid_width":            1000, // default grid width
    "grid_height":           null, // defaults to match width
    "aspect_ratio":          1,    // default is square
    "is_container_height":   false,
    "background_color":      WHITE,
    "is_transparent":        false,
    "tick_period":           0,
    "text_color":            BLACK,
    "text_font_size":        20,
    "text_font_family":      'Arial',
    "text_font_style":       'normal',
    "text_font_weight":      'normal',
    "is_text_wordwrap":      false,
    "text_wordwrap_width":   10,
    "on_init":               null,
    "on_tick":               null,

    "vertices": {
      "stroke_width":     2,
      "stroke_color":     BLACK,
      "fill_color":       WHITE,
      "radius":           20,
      "has_ring":         false,
      "ring_radius":      25,
      "ring_width":       2,
      "ring_color":       BLACK,
      "on_click":         null,
      "on_mouseover":     null,
      "has_pulse":        true,
      "pulse_color":      RED,
      "pulse_alpha":      0.5,
      "pulse_exit_alpha": 0,
      "pulse_duration":   1,
      "pulse_scale":      1.75,
      "is_pulse_yoyo":    true,
      "is_pulse_blur":    true,
      "is_displaying_payload": true,
      "payload":          0,
      "has_id_as_payload": true,
      "payload_offset_x": 0,
      "payload_offset_y": 0,
      "text_color":       BLACK,
      "text_font_size":   20,
      "text_font_family": 'Arial',
      "text_font_style":  'normal',
      "text_font_weight": 'normal',
      "is_text_wordwrap": false,
      "text_wordwrap_width": 1000
    },

    "edges": {
      "journey_duration": 1,
      "stroke_color":     BLACK,
      "stroke_width":     2,
      "is_arrow":         true,
      "arrowhead_angle":  33,
      "arrowhead_length": 15,
      "is_arrowhead_closed": true,
      "is_bidirectional": false,
      "is_displaying_payload": false,
      "payload":          0,
      "payload_offset_x": 0,
      "payload_offset_y": 0,
      "text_color":       BLACK,
      "text_font_size":   20,
      "text_font_family": 'Arial',
      "text_font_style":  'normal',
      "text_font_weight": 'normal',
      "is_text_wordwrap": false,
      "text_wordwrap_width": 10,
      "on_click":         null,
      "on_mouseover":     null
    },

    "travellers": {
      "type":             'spot',
      "is_above_vertices": false,
      "journey_lifespan": 0,
      "radius":           10,
      "stroke_width":     2,
      "stroke_color":     BLACK,
      "fill_color":       BLACK,
      "is_tinted":        false,
      "speed":            1,
      "resource_id":      "bunny",
      "sprite_scale":     1,
      "is_displaying_payload": false,
      "payload":          0,
      "payload_offset_x": 0,
      "payload_offset_y": 0,
      "text_color":       BLACK,
      "text_font_size":   20,
      "text_font_family": 'Arial',
      "text_font_style":  'normal',
      "text_font_weight": 'normal',
      "is_text_wordwrap": false,
      "text_wordwrap_width": 10,
      "on_arrival":       null,
      "on_departure":     null,
      "on_click":         null,
      "on_mouseover":     null
    },

    "resources": [],
  }

  const pixi_text_mappings = {
    "fill":          "text_color",
    "fontSize":      "text_font_size",
    "fontFamily":    "text_font_family",
    "fontStyle":     "text_font_style",
    "fontWeight":    "text_font_weight",
    "wordWrap":      "is_text_wordwrap",
    "wordWrapWidth": "text_wordwrap_width"
    // stroke: '#4a1850',
    // strokeThickness: 5,
    // dropShadow: true,
    // dropShadowColor: '#000000',
    // dropShadowBlur: 4,
    // dropShadowAngle: Math.PI / 6,
    // dropShadowDistance: 6,
  }

  const type_keys = [ 'edges', 'vertices', 'travellers', 'resources'];
  const Graphics  = PIXI.Graphics;
  const Point     = PIXI.Point;
  const Sprite    = PIXI.Sprite;
  const Container = PIXI.Container;

  const blurFilter = new PIXI.filters.BlurFilter();

  // built-in on-event functions (note: underscore prefix)
  let functions = {
    _vertex_transmit_to_random: function(event, graph) {
      if (this instanceof GraphVertex) {
        let t = graph.create_traveller({"at_vertex": this, "journey_lifespan": 1});
        t.payload.set(this.payload.value);
        t.travel(this.get_random_edge_out());
      }
    },
    _vertex_transmit_to_all: function(event, graph) {
      if (this instanceof GraphVertex) {
        for (let i=0; i<this.edges_out.length; i++) {
          let t = new Traveller({"at_vertex": this, "journey_lifespan": 1}, graph);
          t.add_diagram(graph.app.stage);
          t.payload.set(this.payload.value);
          graph.travellers.push(t);
          t.travel(this.edges_out[i]);
        }
      }
    },
    _print_payload: function(event){ // really for debug/example
      let msg = "[" + this.json_type + "] " + this.id + " ";
      if (this.payload) {
        console.log(msg + "has payload value " + this.payload.value);
      } else {
        console.log(msg + "has no payload");
      }
    },
    _pulse: function(event){ // pulses self (or traveller's at_vertex)
      let pulser = null;
      if (this.pulse instanceof Function) {
        pulser = this;
      } else if (this instanceof Traveller) {
        pulser = this.at_vertex;
      }
      if (pulser != null) {
        pulser.pulse();
      }
    },
    _tint: function(event){ // tints self (unless it's a graph)
      if (this.tint instanceof Function) {
        this.tint();
      }
    },
    _send_travellers_on_all_random(event, graph) {
      for (let i=0; i < graph.travellers.length; i++) {
        t = graph.travellers[i];
        if (t.at_vertex != null) {
          t.payload.set(t.at_vertex.payload.value);
          t.travel(t.at_vertex.get_random_edge_out());
        }
      }
    },
    _transmit_from_all_vertices_random(event, graph) {
      for (let i=0; i < graph.vertices.length; i++) {
        let t = graph.create_traveller({"at_vertex": graph.vertices[i], "journey_lifespan": 1});
        t.payload.set(graph.vertices[i].payload.value);
        t.travel(graph.vertices[i].get_random_edge_out());
      }
    }
    // _traveller_deliver_max_payload
    // if (this.at_vertex.payload.value < this.payload.value) {
    //   this.at_vertex.payload.set(this.payload.value);
    //   this.at_vertex.pulse();
    // }
    
  };

  function GraphComponent(config){
    for (key in this.graph.config[this.json_type]) {
      this[key] = get_property_value(config[key], this.graph.config[this.json_type][key]);
    }
    this.text_config = get_text_config(config);
  }
  GraphComponent.prototype.make_diagram_interactive = function(){
    let event_types = ['click', 'mouseover'];
    let pixi_event_types = ['pointertap', 'pointerover']; // equivalences
    for (let i=0; i < event_types.length; i++) {
      let fname = this["on_" + event_types[i]];
      if (fname) {
        if (functions[fname] instanceof Function) {
          this.diagram.on(pixi_event_types[i], (event) => {
            functions[fname].call(this, event, this.graph)
          });
          this.is_interactive = true;
          if (this.diagram) {
            this.diagram.interactive = this.diagram.buttonMode = this.is_interactive;
          }
        } else {
          throw("missing on_"+ event_types[i] + " function: " + fname);
        }
      }
    }
  }

  function Graph(container, initial_config){
    this.container = container;
    this.is_ready = false;
    this.container_size = new PIXI.Point(0, 0); // updated on first resize
    // use defaults, overridden with JSON "graph-specific" defaults
    this.component_type = 'graph';
    this.json_type = 'graphs';
    this.config = JSON.parse(JSON.stringify(default_config));
    this.graph_data = {}; // from AJAX response: per-object config
    this.vertices = [];
    this.vertices_by_id = {};
    this.edges = [];
    this.travellers = [];
    this.sprite_resources = {};
    this.last_tick_timestamp = (new Date).getTime();
    if (initial_config) {
      this.configure_graph(initial_config);
    }
  }
  Graph.prototype.configure_graph = function(initial_config){
    this.graph_data = initial_config;
    for (let i=0; i < type_keys.length; i++) {
      if (this.graph_data[type_keys[i]] === undefined) {
        this.graph_data[type_keys[i]] = type_keys[i] === 'resources'? [] : {};
      }
      // TODO maybe check for hex color strings: may be better as parsed values
      //      if (key.indexOf('color') > -1 && typeof graph_data.config[key] === 'string') {}
    }
    // for each config property, override with loaded JSON if available
    if (! this.graph_data.config) {
      this.graph_data.config = {};
    }
    for (let key in default_config) {
      if (this.graph_data.config[key] != undefined) {
        if (is_type_key(key)) {
          if (key === 'resources') {
            // TODO resources are an array: not (currently) like other type keys
            this.config.resources = this.graph_data.config[key];
          } else {
            for (let k in default_config[key]) {
              if (this.graph_data.config[key] != undefined && this.graph_data.config[key][k] != undefined) {
                this.config[key][k] = this.graph_data.config[key][k];
              }
            }
          }
        } else if (this.graph_data.config[key] != undefined) { // it's a "basic" property
          this.config[key] = this.graph_data.config[key];
        }
      }
    }
    let inline_config = this.container.getAttribute('data-graph-config');
    if (inline_config) {
      inline_config = replace_hyphens_in_keys(inline_config.replace(/\s+/g, ''), true);
      let inline_configs = inline_config.split(",");
      for (let i=0; i < inline_configs.length; i++) {
        let str = inline_configs[i];
        let ix = str.indexOf(":");
        if (ix > 0) {
          let key = str.substring(0, ix).replace(/-/g, '_'); // be forgiving
          let value = str.substr(ix+1);
          if (value.match(/^\d+(\.\d*)?$/) != null) {
            value = parseFloat(value); // unstringify numbers (risky?)
          }
          ix = key.indexOf(".");
          let key_type = undefined;
          if (ix > 0) {
            key_type = key.substring(0, ix);
            key = key.substring(ix+1);
          }
          if (key.indexOf("is_") === 0 || key.indexOf("has_") === 0) {
            value = !(value === 'false' || value == '0');
          }
          if (key_type != undefined) {
            this.config[key_type][key] = value;
          } else {
            this.config[key] = value;
          }
        }
      }
    }
    let app_config = {
      autoResize: true,
      resolution: devicePixelRatio,
      antialias: this.config.antialias,
      backgroundColor: this.config.background_color,
      transparent: this.config.is_transparent
    };
    this.app = new PIXI.Application(app_config);
    if (this.config.is_container_height) {
      this.config.aspect_ratio = 0;
    } else if (this.config.grid_height) {
      this.config.aspect_ratio = this.config.grid_height / this.config.grid_width;
    } else if (this.config.aspect_ratio !=0) {
      this.config.grid_height = this.config.aspect_ratio * this.config.grid_width;
    } else { // inherit container height
      this.config.aspect_ratio = 0;
    }
    if (this.config.aspect_ratio === 0) {
      this.app.resizeTo = this.container;
    }
    this.container.appendChild(this.app.view);
    let resource_ids = {}; // check for dups
    if (this.config && this.config.resources) {
      for (let i=0; i < this.config.resources.length; i++) {
        let r_data = this.config.resources[i];
        if (!resource_ids[r_data.id]) { // don't have it already, OK
          // hmmm: if (this.app.loader.resources[r_data.id]) { don't bother }?
          this.app.loader.add(r_data.id, r_data.resource);
          resource_ids[r_data.id] = true;
        }
      }
    }
    let graph = this;
    this.is_ready = true;
    this.app.loader.load((loader, res) => {graph.run_graph(res)});
  }
  Graph.prototype.run_graph = function(res){
    this.resize_graph();
    this.text_configs = { "default": get_text_config(this.config) };
    this.text_styles = { "default": make_text_style(this.text_configs["default"]) };
    for (let t=0; t < type_keys.length; t++) {
      if (type_keys[t] != "resources") {
        this.text_styles[type_keys[t]] = make_text_style([this.text_configs["default"], this.config[type_keys[t]]]);
        this.text_configs[type_keys[t]] = get_text_config(this.config[type_keys[t]]);
      }
    }
    this.sprite_resources = res; // preserve resources globally
    for (let i=0; i < this.graph_data.vertices.length; i++) {
      this.create_vertex(this.graph_data.vertices[i]);
    }
    for (let i=0; i< this.graph_data.edges.length; i++) {
      this.create_edge(this.graph_data.edges[i]);
    }
    for (let i=0; i< this.graph_data.travellers.length; i++) {
      this.create_traveller(this.graph_data.travellers[i]);
    }
    let graph = this;
    setTimeout(function(){graph.graph_init(graph)}, 1000) // 1 second delay at start
  }
  Graph.prototype.resize_graph = function(){ // to canvas's parent node
    if (this.app) {
      let w = Math.floor(this.container.clientWidth);
      let h = Math.floor(this.container.clientHeight);
      if (w != this.container_size.x || h != this.container_size.y) {
        this.container_size = new Point(w, h);
        this.core_scale = w / this.config.grid_width;
        this.app.stage.scale = new Point(this.core_scale, this.core_scale);
        if (this.config.aspect_ratio === 0) {
          this.app.resize(); // let PIXI resize to container
        } else {
          this.app.renderer.resize(w, w * this.config.aspect_ratio);
        }
        this.app.render(this.app.stage);
      }
    }
  }
  Graph.prototype.get_vertex_by_id = function(id){
    if (! this.vertices_by_id[id]) {
      throw 'cannot find graph vertex with id=' + id;
    }
    return this.vertices_by_id[id];
  }
  Graph.prototype.get_graph_payloads = function(){
    let payloads_by_vertex_id = {};
    for (let i=0; i < this.vertices.length; i++) {
      if (this.vertices[i].payload.value != null) {
        payloads_by_vertex_id[this.vertices[i].id] = this.vertices[i].payload.value;
      }
    }
    return payloads_by_vertex_id;
  }
  Graph.prototype.to_json = function(){
    let json = {};
    json.config = default_config;
    json.config.resources = this.config.resources;
    json.vertices = [];
    json.edges = [];
    json.travellers = [];
    for (let i=0; i < this.vertices.length; i++){
      json.vertices.push(this.vertices[i].to_json())
    }
    json.edges = [];
    for (let i=0; i < this.edges.length; i++){
      json.edges.push(this.edges[i].to_json())
    }
    for (let i=0; i < this.travellers.length; i++){
      json.travellers.push(this.travellers[i].to_json())
    }
    // for every key, if indexOf('color') != -1, do
    // '0x' + ("00000" + g.toString(16)).substring(-6)
    json = JSON.stringify(json);
    console.log(json);
    return json;
  }
  Graph.prototype.tick = function(){
    if (this.config.tick_period > 0) {
      let t = (new Date).getTime();
      if (t - this.last_tick_timestamp >= this.config.tick_period * 1000) {
        this.last_tick_timestamp = t;
        return true;
      }
    }
    return false;
  }
  Graph.prototype.graph_init = function(graph) {
    if (graph.config.on_init) {
      if (functions[graph.config.on_init] instanceof Function) {
        functions[graph.config.on_init].call(this, new Event("init"), graph);
      } else {
        throw "on_init function " + graph.config.on_init + " not found";
      }
    }
    graph.app.ticker.add(
      function(){
        if (graph.tick() && graph.config.on_tick) {
          if (functions[graph.config.on_tick] instanceof Function) {
            functions[graph.config.on_tick].call(this, new Event("tick"), graph);
          } else {
            throw "on_tick function " + graph.config.on_tick + " not found";
          }
        }
      }
    );
  }
  Graph.prototype.create_traveller = function(config) {
    let t = new Traveller(config, this);
    t.add_diagram(this.app.stage);
    this.travellers.push(t);
    return t;
  }
  Graph.prototype.create_vertex = function(config) {
    let vertex = new GraphVertex(config, this);
    this.vertices_by_id[vertex.id] = vertex;
    this.app.stage.addChild(vertex.diagram);
    this.vertices.push(vertex);
    return vertex;
  }
  Graph.prototype.create_edge = function(config) {
    let from_vertex = this.get_vertex_by_id(config.from);
    let to_vertex = this.get_vertex_by_id(config.to);
    let edge = new GraphEdge(from_vertex, to_vertex, config, this);
    this.app.stage.addChildAt(edge.diagram, 0);
    this.edges.push(edge);
    return edge;
  }

  //-----------------------------------------------------------
  // Payload (of a vertex): diagram is its (PIXI) display
  //-----------------------------------------------------------
  function Payload(transport, value){
    this.transport = transport;
    this.diagram = null;
    this.init_value = value;
    this.value = null;
    this.set(value);
  }
  Payload.prototype.set = function(value){
    this.value = value;
    if (this.diagram != null) {
      this.transport.diagram.removeChild(this.diagram);
    }
    if (this.value == null) {
      this.diagram = null;
    } else {
      this.diagram = new PIXI.Text(
        this.value,
        get_text_style(this.transport)
      );
      this.diagram.x = this.transport.payload_offset.x - this.diagram.width/2;
      this.diagram.y = this.transport.payload_offset.y - this.diagram.height/2;
      if (this.transport.is_displaying_payload) {
        this.transport.diagram.addChild(this.diagram);
      }
    }
  }
  
  //-----------------------------------------------------------
  // GraphVertex
  //-----------------------------------------------------------
  function GraphVertex(config, graph){
    this.graph = graph;
    this.component_type = 'vertex';
    this.json_type = 'vertices';
    this.id = config.id;
    GraphComponent.call(this, config);
    this.diagram = new Container();
    this.diagram.position = new Point(config.x, config.y);
    this.edges_out = [];
    this.edges_in = [];
    this.actual_radius = this.has_ring? Math.max(this.ring_radius, this.radius) : this.radius;
    this.tintable = new Graphics(); // separate layer
    this.tintable
      .beginFill(WHITE) // will tint
      .drawCircle(0, 0, this.actual_radius)
      .endFill()
      .tint=this.fill_color;
    let g = new Graphics();
    if (this.has_ring){
      g.lineStyle(this.ring_width, this.ring_color)
      .drawCircle(0, 0, this.ring_radius)
    }
    g.lineStyle(this.stroke_width, this.stroke_color)
      .drawCircle(0, 0, this.radius)
    if (this.has_pulse) {
      this.diagram_pulse = new Graphics();
      this.diagram_pulse.beginFill(WHITE).drawCircle(0, 0, this.radius).endFill();
      this.diagram_pulse.alpha = this.pulse_alpha;
      this.diagram_pulse.tint = this.pulse_color;
      this.diagram_pulse.renderable = false;
      if (this.is_pulse_blur) {
        this.diagram_pulse.filters = [blurFilter];
      }
      this.diagram.addChild(this.diagram_pulse); // must add below vertex's diagram
    }
    this.diagram.addChild(this.tintable);
    this.diagram.addChild(g);
    this.is_interactive = false;
    this.payload_offset = new Point(this.payload_offset_x, this.payload_offset_y);
    if (config.payload === undefined && this.has_id_as_payload) {
      config.payload = this.id;
    }
    this.payload = new Payload(this, config.payload);
    this.make_diagram_interactive();
  }
  GraphVertex.prototype = Object.create(GraphComponent.prototype);
  GraphVertex.prototype.position = function(){
    return this.diagram.position;
  }
  GraphVertex.prototype.x = function(){
    return this.diagram.position.x;
  }
  GraphVertex.prototype.y = function(){
    return this.diagram.position.y;
  }
  GraphVertex.prototype.get_edge_to = function(to_vertex, chooser){
    // chooser will be 'first' if not specified, else 'random' or index?
    let candidate_edges = [];
    let index = 0;
    if (this.edges_out.length > 0) {
      for (let i=0; i<this.edges_out.length; i++) {
        if (this.edges_out[i].to === to_vertex || this.edges_out[i].from === to_vertex) {
          candidate_edges.push(this.edges_out[i]);
          if (! chooser) {
            break;
          }
        }
      }
      if (chooser === 'random') {
        index = get_random_int(candidate_edges.length)
      } else if (chooser === 'last') {
        index = candidate_edges.length - 1;
      }
    }
    return candidate_edges[index]; // maybe be undefined if there were none
  }
  GraphVertex.prototype.get_random_edge_out = function(){
    if (this.edges_out.length > 0) {
      return this.edges_out[get_random_int(this.edges_out.length)];
    }
  }
  GraphVertex.prototype.pulse = function(pulse_color){
    if (this.has_pulse) {
      this.stop_pulse();
      this.diagram_pulse.renderable = true;
      this.diagram_pulse.alpha = this.pulse_alpha;
      this.diagram_pulse.tint = pulse_color != null? pulse_color : this.pulse_color;
      let vertex = this;
      TweenMax.to(
        this.diagram_pulse.scale,
        this.is_pulse_yoyo? this.pulse_duration/2 : this.pulse_duration,
        {
          yoyo: this.is_pulse_yoyo,
          repeat: this.is_pulse_yoyo? 1 : 0,
          x: this.pulse_scale,
          y: this.pulse_scale,
          onComplete: function(){vertex.diagram_pulse.renderable = false;}
        }
      );
      if (this.pulse_exit_alpha != this.pulse_alpha) {
        TweenMax.to(this.diagram_pulse, this.pulse_duration/2, { delay: this.pulse_duration/2, alpha: this.pulse_exit_alpha } );
      }
    }
  }
  GraphVertex.prototype.stop_pulse = function(){
    if (this.has_pulse) {
      TweenMax.killTweensOf(this.diagram_pulse.scale);
      this.diagram_pulse.renderable = false;
      this.diagram_pulse.scale = new Point(1, 1);
    }
  }
  GraphVertex.prototype.tint = function(tint_color){
    if (tint_color === undefined) {
      tint_color = this.fill_color;
    }
    if (this.tintable) {
      this.tintable.tint = tint_color;
    } else {
      this.diagram.children[1].tint = tint_color;
    }
  }
  GraphVertex.prototype.to_json = function(){
    let json = get_json_properties(this);
    json.id = this.id;
    json.x = this.x();
    json.y = this.y();
    json.payload = this.payload.init_value;
    return json;
  }

  //-----------------------------------------------------------
  // GraphEdge
  //-----------------------------------------------------------
  function GraphEdge(from_vertex, to_vertex, config, graph){
    this.graph = graph;
    this.component_type = 'edge';
    this.json_type = 'edges';
    GraphComponent.call(this, config);
    this.from = from_vertex;
    this.to = to_vertex;
    this.from.edges_out.push(this);
    this.to.edges_in.push(this);
    if (this.is_bidirectional) {
      this.from.edges_in.push(this);
      this.to.edges_out.push(this);
    }
    this.control_points = config.control_points? config.control_points : [];
    this.text_config = get_text_config(config);
    let diagram = new Graphics();
    diagram.lineStyle(this.stroke_width, this.stroke_color);
    diagram.moveTo(0,0);
    if (this.control_points.length === 0) {
      diagram.lineTo(
        to_vertex.diagram.position.x - from_vertex.diagram.position.x,
        to_vertex.diagram.position.y - from_vertex.diagram.position.y,
      );
    } else if (this.control_points.length === 1) {
      diagram.quadraticCurveTo(
        this.control_points[0].x,
        this.control_points[0].y,
        to_vertex.x() - from_vertex.x(),
        to_vertex.y() - from_vertex.y()
      );
    } else if (this.control_points.length === 2) {
      diagram.bezierCurveTo(
        this.control_points[0].x,
        this.control_points[0].y,
        this.control_points[1].x,
        this.control_points[1].y,
        to_vertex.x() - from_vertex.x(),
        to_vertex.y() - from_vertex.y()
      );
    } else {
      throw "too many control points";
    }
    diagram.position = from_vertex.position();
    this.diagram = diagram;
    if (this.is_arrow) {
      this._draw_arrowhead(false);
      if (this.is_bidirectional) {
        this._draw_arrowhead(true);
      }
    }
    this.payload_offset = this.calculate_midpoint();
    this.payload_offset.x += this.payload_offset_x;
    this.payload_offset.y += this.payload_offset_y;
    this.payload = new Payload(this, this.payload);
    this.make_diagram_interactive();
  }
  GraphEdge.prototype = Object.create(GraphComponent.prototype);
  GraphEdge.prototype._draw_arrowhead = function(is_reversed){
    let from   = is_reversed? this.to : this.from;
    let to     = is_reversed? this.from : this.to;
    let p_to   = to.diagram.position;
    let p_from = from.diagram.position;
    let offset = is_reversed? new Point(0,0) : new Point(p_to.x - p_from.x, p_to.y - p_from.y);
    let p      = p_from;
    let arrowhead_rot = this.arrowhead_angle * (Math.PI/360);
    if (this.control_points.length > 0) { // curved edge
      p = this.control_points[is_reversed? 0 : this.control_points.length-1];
      // note control points are _always_ relative to actual from (it's how they're drawn)
      p = new Point(this.from.diagram.position.x + p.x, this.from.diagram.position.y + p.y );
    }
    let theta = 0;
    if (p.x - p_to.x === 0) {
      if (p.y > p_to.y) {
        theta = Math.PI * 0.5;
      } else {
        theta = Math.PI * 1.5;
      }
    } else {
      theta = Math.atan((p.y - p_to.y)/(p.x - p_to.x));
    }
    if (p.x < p_to.x ) {
      theta += Math.PI;
    }
    let v_rad = 20 * to.actual_radius;
    let p_tip = new Point(
        offset.x + Math.cos(theta) * v_rad,
        offset.y + Math.sin(theta) * v_rad
    );
    let p_arrow = [
      new Point(
        p_tip.x + Math.cos(theta - arrowhead_rot) * this.arrowhead_length,
        p_tip.y + Math.sin(theta - arrowhead_rot) * this.arrowhead_length
      ),
      p_tip,
      new Point(
        p_tip.x + Math.cos(theta + arrowhead_rot) * this.arrowhead_length,
        p_tip.y + Math.sin(theta + arrowhead_rot) * this.arrowhead_length
      )
    ];
    this.diagram.lineStyle(this.stroke_width, this.stroke_color);
    if (this.is_arrowhead_closed) { // triangle
      this.diagram.beginFill(this.stroke_color).drawPolygon(p_arrow).endFill();
    } else { // line
      this.diagram.moveTo(p_arrow[0].x, p_arrow[0].y)
      .lineTo(p_arrow[1].x, p_arrow[1].y)
      .lineTo(p_arrow[2].x, p_arrow[2].y);
    }
  }
  GraphEdge.prototype.tint = function(tint_color){
    if (tint_color === undefined) {
      this.diagram.tint = this.fill_color;
    } else {
      this.diagram.tint = tint_color;
    }
  }
  GraphEdge.prototype.to_s = function(){
    return "<Edge: " + this.from.id + "↔" + this.to.id + ">";
  }
  GraphEdge.prototype.get_tween_data = function(start_vertex) {
    let is_reverse = start_vertex != this.from;
    let start = is_reverse? this.to : this.from;
    let end = is_reverse? this.from: this.to;
    let json = {};
    if (this.control_points.length === 2) {
      let cp_first = {x: this.from.x()+this.control_points[0].x, y: this.from.y()+this.control_points[0].y};
      let cp_second = {x: this.from.x()+this.control_points[1].x, y: this.from.y()+this.control_points[1].y};
      json = {
        bezier: {
          type: "cubic",
          values:[
              {x: start.x(), y:start.y()},
              is_reverse? cp_second : cp_first,
              is_reverse? cp_first : cp_second,
              {x: end.x(), y: end.y()},
          ]
        }
      }
    } else if (this.control_points.length === 1) {
      json = {
        bezier: {
          type: "quadratic",
          values:[
              {x: start.x(), y:start.y()},
              {x: this.from.x()+this.control_points[0].x, y: this.from.y()+this.control_points[0].y},
              {x: end.x(), y: end.y()},
          ]
        }
      }
    } else { // no curve: linear
      json = {x: end.x(), y: end.y()}
    }
    return json;
  }
  GraphEdge.prototype.calculate_midpoint = function() { // really an average offset
    let midpoint = new Point(0, 0);
    midpoint.x = this.to.x() - this.from.x();
    midpoint.y = this.to.y() - this.from.y();
    for (let i=0; i<this.control_points.length; i++) {
      midpoint.x += this.control_points[i].x;
      midpoint.y += this.control_points[i].y;
    }
    let qty_points = 2 + this.control_points.length;
    midpoint.x = midpoint.x / qty_points;
    midpoint.y = midpoint.y / qty_points;
    return midpoint;
  }
  GraphEdge.prototype.is_edge_from = function(origin){
    return origin != null && (origin === this.from
      || (this.is_bidirectional && origin === this.to));
  }
  GraphEdge.prototype.is_edge_to = function(destination){
    return destination != null && (destination === this.to
      || (this.is_bidirectional && destination === this.from));
  }
  GraphEdge.prototype.to_json = function(){
    let json = get_json_properties(this);
    json.from = this.from.id;
    json.to = this.to.id;
    if (this.control_points.length > 0) {
      json.control_points = this.control_points;
    }
    return json;
  }

  //-----------------------------------------------------------
  // Traveller is anything that travels along edges
  // destroyed after journey_lifespan journeys (if positive)
  //-----------------------------------------------------------
  function Traveller(config, graph){
    this.graph = graph;
    this.component_type = 'traveller';
    this.json_type = 'travellers';
    this.id = config.id;
    GraphComponent.call(this, config);
    this.start_at_vertex = config.at_vertex;
    this._is_travelling = false; // flag: when travelling
    this.following_edge = null;
    this.at_vertex = this.start_at_vertex instanceof GraphVertex?
        this.start_at_vertex
        :
        this.graph.get_vertex_by_id(this.start_at_vertex);
    this.qty_journeys = 0;
    this.from = null;
    this.to = null;
    this.text_config = get_text_config(config);
    if (this.speed === 0) {
      this.speed = 1; // avoid division by zero: ignore setting
    }
    if (this.type === 'sprite') {
      this.diagram = new Sprite(graph.sprite_resources[this.resource_id].texture);
      this.diagram.anchor.x = 0.5;
      this.diagram.anchor.y = 0.5;
      this.diagram.scale = new Point(this.sprite_scale, this.sprite_scale);
      if (this.is_tinted) { this.diagram.tint = this.fill_color;}
    } else if (this.type === 'spot') {
      this.tintable = new Graphics(); // separate layer
      this.tintable
        .beginFill(WHITE) // will tint
        .drawCircle(0, 0, this.radius)
        .endFill()
        .tint=this.fill_color;
      let g = new Graphics();
      g.lineStyle(this.stroke_width, this.stroke_color)
        .drawCircle(0, 0, this.radius)
      this.diagram = new Container();
      this.diagram.addChild(this.tintable, g);
    }
    this.diagram.position = this.at_vertex.position();
    this.payload_offset = new Point(this.payload_offset_x, this.payload_offset_y);
    this.payload = new Payload(this, this.payload);
    this.graph.app.stage.addChild(this.diagram);
    this.make_diagram_interactive();
  }
  Traveller.prototype = Object.create(GraphComponent.prototype);
  Traveller.prototype.travel = function(edge){
    let is_travelling = false;
    if (edge && edge.is_edge_from(this.at_vertex)) {
      this._is_travelling = is_travelling = true;
      this.following_edge = edge;
      this.from = this.at_vertex;
      this.to = edge.to === this.from? edge.from : edge.to; // reverse
      if (functions[this.on_departure] instanceof Function) {
        functions[this.on_departure].call(this, new Event("departure"), this.graph);
      }
      this.at_vertex = null;
      let settings_json = edge.get_tween_data(this.from);
      let traveller = this;
      settings_json['onComplete'] = function(){traveller._on_arrival()}
      settings_json['ease'] = Linear.easeNone;
      TweenMax.to(
        this.diagram.position,
        edge.journey_duration * 1/this.speed,
        settings_json
      );
    }
    return is_travelling;
  }
  Traveller.prototype._on_arrival = function(){
    this._is_travelling = false; // journey is over
    this.at_vertex = this.to;
    this.qty_journeys += 1;
    if (functions[this.on_arrival] instanceof Function) {
      functions[this.on_arrival].call(this, new Event("arrival"), this.graph);
    }
    if (! this._is_travelling ) { // arrival might have triggered travel() call
      this.following_edge = null;
      this.to = null;
      this.from = null;
    }
    if (this.journey_lifespan && this.qty_journeys >= this.journey_lifespan) {
      this.destroy();
    }
  }
  Traveller.prototype.destroy = function(){
    if (this.diagram) {
      TweenMax.killTweensOf(this.diagram.position);
      if (this.diagram.parent) {
        this.diagram.parent.removeChild(this);
      }
      this.diagram.visible = false;
      this.diagram.destroy();
    }
    for (let i=0; i < this.graph.travellers.length; i++){
      if (this.graph.travellers[i] === this) {
        this.graph.travellers.splice(i, 1);
        break;
      }
    }
  }
  Traveller.prototype.tint = function(tint_color){
    if (tint_color === undefined) {
      if  (this.type === 'sprite' && ! this.is_tinted) {
        tint_color = WHITE;
      } else {
        tint_color = this.fill_color;
      }
    }
    this.diagram.tint = tint_color;
  }
  Traveller.prototype.add_diagram = function(container){
    if (this.is_above_vertices) {
      container.addChild(this.diagram);
    } else {
      container.addChildAt(this.diagram, this.graph.edges.length);
    }
  }
  Traveller.prototype.to_json = function(){
    let json = get_json_properties(this);
    json.id = this.id;
    json.at_vertex = this.start_at_vertex;
    return json;
  }

  //-----------------------------------------------------------
  // utility functions
  //-----------------------------------------------------------

  function get_random_int(max) { // 3 => {0, 1, 2}
    return Math.floor(Math.random() * Math.floor(max));
  }

  function get_property_value(new_value, default_value) {
    return (new_value != undefined)? new_value : default_value;
  }

  // only want properties that differ from the global
  function get_json_properties(obj){
    let json = {};
    for (let key in obj.graph.config[obj.json_type]) {
      if (obj[key] != undefined && obj[key] != obj.graph.config[obj.json_type][key]) {
        json[key] = obj[key];
      }
    }
    return json;
  }

  function get_text_config(config) { // extracts settings for text (e.g. text_color or is_text_wordwrap)
    let text_config = {};
    let has_keys = false;
    for (let k in config) {
      if (k.indexOf('text_') >= 0) {
        text_config[k] = config[k];
      }
    }
    return text_config;
  }

  function get_text_style(obj){
    if (obj.text_config) {
      return make_text_style([
        obj.graph.text_configs["default"],
        obj.graph.text_configs[obj.json_type],
        obj.text_config
      ]);
    } else {
      return obj.graph.text_styles[obj.json_type];
    }
  }

  function make_text_style(configs) {
    // start with base config, and update it with subsequent configs
    if (! (configs instanceof Array)) {
      configs = [configs];
    }
    let pixi_config = {};
    for (let i=0; i < configs.length; i++) {
      if (configs[i]) {
        for (let pixi_k in pixi_text_mappings) {
          if (configs[i][pixi_text_mappings[pixi_k]] != undefined) {
            pixi_config[pixi_k] = configs[i][pixi_text_mappings[pixi_k]];
          }
        }
      }
    }
    pixi_config.resolution = 1; // explicit for Android Chrome maybe?
    return new PIXI.TextStyle(pixi_config);
  }

  function is_type_key(key) {
    for (let i=0; i < type_keys.length; i++) {
      if (key === type_keys[i]) {
        return true;
      }
    }
    return false;
  }

  // Be generous about incoming JSON: life's too short to penalise hyphen/underscore errors.
  // This regexp approach is a bit bodgey (really should "fix" the object not the JSON).
  // Note: specific inline use-case: hyphens are only expected/found in final part of nested
  //       property name: (i.e. foofoo.bar-bar:)]
  function replace_hyphens_in_keys(json_string, is_using_unquoted_keys) {
    let quote = is_using_unquoted_keys? '' : '"';
    var m = json_string.match(new RegExp(quote + '\\w+(-\\w+)+' + quote + '\\s*:', 'g'));
    if (m != null) {
      for (let i=0; i < m.length; i++) {
        json_string = json_string.replace(m[i], m[i].replace(/-/g, '_'));
      }
    }
    return json_string;
  }

  GraphFellow.call_function = function(caller, fname) {
    // external access to named functions
    if (caller) {
      if (functions[fname]) {
        let graph = caller instanceof Graph? caller : caller.graph;
        if (! (graph instanceof Graph)) {
          throw "named function caller must have access to graph object"
        } else {
          functions[fname].call(caller, new Event("call"), graph);
        }
      } else {
        throw "no function named \"" + fname +"\"";
      }
    } else {
      throw "call_function called without a caller";
    }
  }
  
  GraphFellow.add_function = function(fname, func) {
    if (func instanceof Function) {
      if (("" + fname).indexOf('_') === 0) {
        throw "add_function failed: name starts with underscore '" + fname + "'";
      }
      if (functions[fname]) {
        throw "add_function failed: named function already exists '" + fname + "'";
      }
      functions[fname] = func;
    } else {
      throw "add_function failed: argument was not a function, named '" + fname + "'";
    }
  }

  window.addEventListener("resize", function (event) {
    for (let i=0; i < GraphFellow.graphs.length; i++) {
      if (GraphFellow.graphs[i] != null) {
        GraphFellow.graphs[i].resize_graph();
      }
    }
  });
  
  // can manually add a graph here (e.g., if div isn't ready when the init autoruns)
  GraphFellow.create_graph = function(container, initial_config) {
    let new_graph = new Graph(container, initial_config);
    if (initial_config == null) { // no config, so make AJAX call to get it
      let json_filename = container.getAttribute('data-graph-src');
      if (json_filename == null || ! json_filename.match(/\w/)) {
        throw "cannot make graph: missing data-graph-src attribute";
      }
      let req = new XMLHttpRequest();
      req.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status == 200) {
            new_graph.configure_graph(JSON.parse(replace_hyphens_in_keys(this.responseText, false)));
          } else {
            let err_msg = "HTTP error (" + json_filename + ") " + this.status + ": " + this.statusText;
            new_graph.error = err_msg; // needs timestamp?
            console.log(err_msg);
          }
        }
      }
      req.open("GET", json_filename, true);
      req.send();
    }
    GraphFellow.graphs.push(new_graph);
    return new_graph;
  }
  
  GraphFellow.init = function(divs) {
    let new_graphs = [];
    if (divs !== undefined) {
      if (! (divs instanceof Array )) {
        divs = [divs];
      }
    } else {
      divs = document.querySelectorAll(".graphfellow");
    }
    for (let i=0; i < divs.length; i++) {
      if (divs[i] && typeof divs[i].getAttribute === "function" && divs[i].getAttribute('data-graph-src')) {
        new_graphs.push(GraphFellow.create_graph(divs[i], null));
      }
    }
    return new_graphs.length === 1? new_graphs[0] : new_graphs;
  }

}( window.GraphFellow = window.GraphFellow || {}));
