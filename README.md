# Leaflet Streamlines

[![npm version](https://badge.fury.io/js/leaflet-streamlines.svg)](https://badge.fury.io/js/leaflet-streamlines)

Visualise two dimensional vector fields in leaflet using stream lines.

![Image of Leaflet Streamlines](https://runnalls.s3.eu-central-1.amazonaws.com/streamlines.gif)

Grid of simulated water velocity values on Lake Geneva from the Meteolakes project, plotted as streamlines.

Check out the examples:

- [Basic](https://jamesrunnalls.github.io/leaflet-streamlines/example/basic/) ([source](https://github.com/jamesrunnalls/leaflet-streamlines/blob/master/example/basic/index.html))

This project is inspired by [earth](https://earth.nullschool.net/) and borrows code from the [IH.Leaflet.CanvasLayer.Field](https://github.com/IHCantabria/Leaflet.CanvasLayer.Field) project.

## Quick start

```
import L from "leaflet";
import 'leaflet-streamlines';
```

or

```
<link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
    integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
    crossorigin=""
/>
<script
    src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"
    integrity="sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA=="
    crossorigin=""
></script>
<script type="text/javascript" src="https://unpkg.com/leaflet-streamlines"></script>
```

then

```
var map = L.map("map");
L.streamlines(data, options).addTo(map);
```

## API reference

### data

Data must be an object {u: [[]], v:[[]]} where u and v are 2D arrays of equivalent shape.
u: y veloctiy (northward)
v: x veloctiy (eastward)

### options

| Option          | Description                                                                                                                                    | Default | Type   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------ |
| xMax (Required) | Maximum x coordinate                                                                                                                           |         | Number |
| xMin (Required) | Minimum x coordinate                                                                                                                           |         | Number |
| yMax (Required) | Maximum y coordinate                                                                                                                           |         | Number |
| yMin (Required) | Minimum y coordinate                                                                                                                           |         | Number |
| paths           | Number of streamlines to plot                                                                                                                  | 800     | Number |
| color           | Color of streamlines, either a html color ("white", #FF5733) or a <br> function that returns a color based on a single input of velocity magnitude. | white   | Custom |
| width           | Width of the streamline                                                                                                                        | 0.5     | Number |
| fade            | Control the streamline fade                                                                                                                    | 0.97    | Number |
| duration        | Milliseconds between timesteps                                                                                                                 | 10      | Number |
| maxAge          | Max number of timesteps for streamline                                                                                                         | 50      | Number |
| velocityScale   | Factor to toggle speed of streamlines                                                                                                          | 0.01    | Number |
| opacity         | Opacity of streamlines                                                                                                                         | 1       | Number |
