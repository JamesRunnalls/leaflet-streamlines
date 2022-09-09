import L from "leaflet";
import { timer } from "d3";

L.Streamlines = (L.Layer ? L.Layer : L.Class).extend({
  options: {
    paths: 800,
    color: "white",
    width: 0.5,
    fade: 0.97,
    duration: 10,
    maxAge: 50,
    velocityScale: 0.01,
    opacity: 1,
    xMax: false,
    xMin: false,
    yMax: false,
    yMin: false,
  },
  initialize: function (data, options) {
    L.Util.setOptions(this, options);
    if (
      !this.options.xMax ||
      !this.options.xMin ||
      !this.options.yMax ||
      !this.options.yMin
    ) {
      throw new Error("xMax, xMin, yMax and yMin are required.");
    }
    this._data = data;
    this._nCols = this._data.u[0].length;
    this._nRows = this._data.u.length;
    this._xSize = (this.options.xMax - this.options.xMin) / this._nCols;
    this._ySize = (this.options.yMax - this.options.yMin) / this._nRows;
    this.timer = null;
  },

  onAdd: function (map) {
    this._map = map;

    if (!this._canvas) {
      this._initCanvas();
    }

    if (this.options.pane) {
      this.getPane().appendChild(this._canvas);
    } else {
      map._panes.overlayPane.appendChild(this._canvas);
    }
    map.on("click", this._onClick, this);
    map.on("moveend", this._reset, this);
    map.on("movestart", this._clear, this);
    map.on("mousemove", this._onMousemove, this);
    this._reset();
  },

  updateData: function (data) {
    this._data = data;
    this._nCols = this._data.u[0].length;
    this._nRows = this._data.u.length;
    this._xSize = (this.options.xMax - this.options.xMin) / this._nCols;
    this._ySize = (this.options.yMax - this.options.yMin) / this._nRows;
  },

  _reset: function (event) {
    this._stopAnimation();
    var topLeft = this._map.containerPointToLayerPoint([0, 0]);
    var size = this._map.getSize();
    this._canvas.width = size.x;
    this._canvas.height = size.y;
    this._width = size.x;
    this._height = size.y;
    L.DomUtil.setPosition(this._canvas, topLeft);
    this._drawLayer();
  },

  _clear: function (event) {
    this._stopAnimation();
    this._ctx.clearRect(0, 0, this._width, this._height);
  },

  onRemove: function (map) {
    if (this.options.pane) {
      this.getPane().removeChild(this._canvas);
    } else {
      map.getPanes().overlayPane.removeChild(this._canvas);
    }
    map.off("click", this._onClick, this);
    map.off("moveend", this._reset, this);
    map.off("movestart", this._clear, this);
    map.off("mousemove", this._onMousemove, this);
  },

  addTo: function (map) {
    map.addLayer(this);
    return this;
  },

  _initCanvas: function () {
    var canvas = (this._canvas = L.DomUtil.create(
      "canvas",
      "leaflet-streamlines-layer leaflet-layer"
    ));

    var originProp = L.DomUtil.testProp([
      "transformOrigin",
      "WebkitTransformOrigin",
      "msTransformOrigin",
    ]);
    canvas.style[originProp] = "50% 50%";
    canvas.style["opacity"] = this.options.opacity;

    var size = this._map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;

    var animated = this._map.options.zoomAnimation && L.Browser.any3d;
    L.DomUtil.addClass(
      canvas,
      "leaflet-zoom-" + (animated ? "animated" : "hide")
    );

    this._canvas = canvas;
    this._ctx = canvas.getContext("2d");
    this._width = canvas.width;
    this._height = canvas.height;
  },

  _drawLayer: function () {
    this._ctx.clearRect(0, 0, this._width, this._height);
    this._paths = this._prepareParticlePaths();
    let self = this;
    for (let i = 0; i < 10; i++) {
      self._moveParticles();
      self._drawParticles();
    }
    this.timer = timer(function () {
      self._moveParticles();
      self._drawParticles();
    }, this.options.duration);
  },

  _moveParticles: function () {
    let self = this;
    this._paths.forEach(function (par) {
      if (par.age > self.options.maxAge) {
        self._randomPosition(par);
        par.age = 0;
      }
      let xt = par.x + par.u * self.options.velocityScale;
      let yt = par.y + par.v * self.options.velocityScale;
      let index = self._getIndexAtPoint(xt, yt);
      if (index === null) {
        self._randomPosition(par);
        par.age = 0;
      } else {
        par.xt = xt;
        par.yt = yt;
        par.ut = self._data.u[index[0]][index[1]];
        par.vt = self._data.v[index[0]][index[1]];
      }

      par.age += 1;
    });
  },

  _drawParticles: function () {
    // Previous paths...
    let ctx = this._ctx;
    ctx.globalCompositeOperation = "destination-in";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = "source-over";
    //ctx.globalCompositeOperation = prev;

    // fading paths...
    ctx.fillStyle = `rgba(0, 0, 0, ${this.options.fade})`;
    ctx.lineWidth = this.options.width;
    ctx.strokeStyle = this.options.color;

    // New paths
    let self = this;
    this._paths.forEach(function (par) {
      self._drawParticle(ctx, par);
    });
  },

  _drawParticle: function (ctx, par) {
    if (par.age <= this.options.maxAge && par !== null && par.xt) {
      let sourcelatlng = [par.y, par.x];
      let targetlatlng = [par.yt, par.xt];
      let source = new L.latLng(sourcelatlng[0], sourcelatlng[1]);
      let target = new L.latLng(targetlatlng[0], targetlatlng[1]);

      try {
        let pA = this._map.latLngToContainerPoint(source);
        let pB = this._map.latLngToContainerPoint(target);

        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);

        // next-step movement
        par.x = par.xt;
        par.y = par.yt;
        par.u = par.ut;
        par.v = par.vt;

        // colormap vs. simple color
        let color = this.options.color;
        if (typeof color === "function") {
          let mag = Math.sqrt(par.u ** 2 + par.v ** 2);
          ctx.strokeStyle = color(mag);
        }

        let width = this.options.width;
        if (typeof width === "function") {
          let mag = Math.sqrt(par.u ** 2 + par.v ** 2);
          ctx.lineWidth = width(mag);
        }

        ctx.stroke();
      } catch (e) {
        this._stopAnimation();
      }
    }
  },

  _getIndexAtPoint(x, y) {
    var i = this._nRows - Math.round((y - this.options.yMin) / this._ySize);
    var j = Math.round((x - this.options.xMin) / this._xSize);
    if (
      i > -1 &&
      i < this._nRows &&
      j > -1 &&
      j < this._nCols &&
      this._data.u[i][j] !== null &&
      this._data.v[i][j] !== null
    ) {
      return [i, j];
    } else {
      return null;
    }
  },

  _prepareParticlePaths: function () {
    let paths = [];
    for (var i = 0; i < this.options.paths; i++) {
      let p = this._randomPosition();
      if (p !== null) {
        p.age = this._randomAge();
        paths.push(p);
      }
    }
    return paths;
  },

  _randomAge: function () {
    return Math.floor(Math.random() * this.options.maxAge);
  },

  _randomPosition: function (o = {}) {
    delete o.xt;
    delete o.yt;
    delete o.ut;
    delete o.vt;

    for (var k = 0; k < 1000; k++) {
      let i = Math.ceil(Math.random() * this._nRows) - 1;
      let j = Math.ceil(Math.random() * this._nCols) - 1;
      if (this._data.u[i][j] !== null && this._data.v[i][j] !== null) {
        o.x =
          this.options.xMin +
          j * this._xSize +
          this._xSize * Math.random() -
          this._xSize / 2;
        o.y =
          this.options.yMin +
          (this._nRows - i) * this._ySize +
          this._ySize * Math.random() -
          this._ySize / 2;
        o.u = this._data.u[i][j];
        o.v = this._data.v[i][j];
        return o;
      }
    }
    return null;
  },

  _stopAnimation: function () {
    if (this.timer) {
      this.timer.stop();
    }
  },

  _onMousemove: function (t) {
    try {
      var e = this._queryValue(t);
      this.fire("mousemove", e);
    } catch (e) {
      console.error("Leaflet streamlines mousemove event failed.");
    }
  },

  getLatLng: function () {
    return false;
  },

  _onClick: function (t) {
    try {
      var e = this._queryValue(t);
      this.fire("click", e);
    } catch (e) {
      console.error("Leaflet streamlines click event failed.");
    }
  },

  _queryValue: function (click) {
    let index = this._getIndexAtPoint(click.latlng.lng, click.latlng.lat);
    if (index === null) {
      click["value"] = { u: null, v: null };
    } else {
      click["value"] = {
        u: this._data.u[index[0]][index[1]],
        v: this._data.v[index[0]][index[1]],
      };
    }
    return click;
  },
});

L.streamlines = function (data, options) {
  return new L.Streamlines(data, options);
};
