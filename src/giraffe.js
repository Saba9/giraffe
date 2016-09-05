// vim: fdm=marker
(function($) {
  
  /**
   * Giraffe is plug-in for the jQuery Javascript library. It is a customizable tool
   * intended for generating interactive financial charts drawn on the HTML5 canvas
   * element.
   */
  
  $(document).ready(function(){
    window.Giraffe = [];
  });
  let CanvasRegion = function(context, xOff, yOff, width, height){ //{{{
    return {
      context: context,
      // All in pixels
      xOff: xOff,
      yOff: yOff,
      width: width,
      height: height,
      drawBounds: function(){
        context.fillStyle = '#'+Math.random().toString(16).substr(-6);
        context.globalAlpha = 0.5

        context.fillRect(0, 0, this.width, this.height);

        context.fillStyle = "black";
        context.globalAlpha = 1.0
      },
      drawWithin: function(func){
        this.context.translate(xOff, yOff);
        func(this);
        this.context.translate(-xOff, -yOff);
      }
    }
  } //}}}

  let Giraffe = function(canvasElem, config){
    "use strict";

    // TODO: set canvas DPI by looking at devices DPI.
    // http://stackoverflow.com/a/15666143
    config = $.extend({
      graphs: [],
      regions: []
    }, config);

    let giraffe = {
      canvas: canvasElem,
      context: canvasElem.getContext('2d'), 
      config: config,
      cache: {
        canvasRegionForGraph: []
      },
      _xRatio: canvasElem.width / $(canvasElem).width(),
      _yRatio: canvasElem.height / $(canvasElem).height(),
      _parseMeasurment: function(measurment){ //{{{
        let matches = /(\d*)\s*([a-zA-Z%]*)/.exec(measurment);
        return [matches[1], matches[2]]
      }, //}}}
      _measurmentToPx: function(measurment, maximum){ //{{{
        let parsed = this._parseMeasurment(measurment);
        let num = parsed[0];
        let units = parsed[1];
        if(units === "%"){
          return (num / 100) * maximum;
        } else {
            return parseInt(num);
        }
      },//}}}
      _regionForGraph: function(graphConf){ //#{{{
        if(graphConf.regionName){
          for(var i=0; i < this.config.regions.length; i++){
            let region = this.config.regions[i];
            if(region.name === graphConf.regionName){
              return region;
            }
          }
        } 
        return {
          name: "default",
          width: "100%",
          height: "100%",
          xStart: "0",
          yStart: "0"
        }
      },//#}}}
      _setFillColor: function(color){ //{{{
        if(color){
          this.context.fillStyle = color;
        } else {
          this.context.fillStyle = "black";
        }
      },//}}}
      _getOptions: function() {//{{{
        if(typeof(this.config.optionsRetrievalFn) === "function"){
          return this.config.optionsRetrievalFn();
        } else {
          return new Object();
        }
      },//}}}
      _drawLine: function(x1, y1, x2, y2){//{{{
        this.context.beginPath();
        this.context.moveTo(x1, y1);
        this.context.lineTo(x2, y2);
        this.context.stroke();
      },//}}}
      _setStrokeColor: function(color){//{{{
        if(color){
          this.context.strokeStyle = color;
        } else {
          this.context.strokeStyle = "black"; // TODO: Use variables instead.
        }
      },//}}}
      _drawCandle: function(xOff, yOff, minY, maxY, rHeight, data, bodyWidth){//{{{
        let candleHighY   = (1 - (data[0] - minY) / (maxY - minY)) * rHeight;
        let candleLowY    = (1 - (data[1] - minY) / (maxY - minY)) * rHeight;
        let candleOpenY   = (1 - (data[2] - minY) / (maxY - minY)) * rHeight;
        let candleCloseY  = (1 - (data[3] - minY) / (maxY - minY)) * rHeight;
        
        let y1 = Math.min(candleOpenY, candleCloseY)
        let y2 = Math.max(candleOpenY, candleCloseY)
        this._drawLine(xOff, yOff + candleHighY, xOff, yOff + candleLowY); // draw wick
        this._setFillColor(data[3] > data[2] ? "#00cc00" : "#ff5c5c")
        this.context.fillRect(xOff - bodyWidth / 2, yOff + y1, bodyWidth, y2 - y1);
        this._setFillColor();
      },//}}}
      _setFontSizeForWidth(text, maxWidth, min, max, fontFam){//{{{
        let size = max;
        // Lazy inefficient method. Binary search would better.
        do {
          this.context.font = size + "px " + fontFam;
          size -= 1;
        } while(this.context.measureText(text).width > maxWidth && size > min);
      },//}}}
      _drawGridLines: function(xOff, yOff, minY, maxY, bWidth, bHeight, n){//{{{
        let diff = maxY - minY; 
        let dYIncr = diff / n; // Reffering to increments in datas y val
        let gYIncr = dYIncr / (maxY - minY) * bHeight;
        let dYVal = maxY;
        this._setStrokeColor("#787878"); // TODO: Use var for this color...
        this._setFillColor("#666");
        for(var i=0; i < n + 1; i++){
          this._drawLine(xOff, yOff, xOff + bWidth, yOff);
          this.context.fillText("" + dYVal.toFixed(2), xOff + bWidth - this.context.measureText("6.08").width, yOff - 5); 
          yOff += gYIncr;
          dYVal -= dYIncr; // increment is kinda misleading...
        }
        this._setStrokeColor();
        this._setFillColor();
      },//}}}
      _getPointerCoords: function(evt){//{{{
          let rect = this.canvas.getBoundingClientRect();
          let x = Math.round(evt.clientX - rect.left) * this._xRatio;
          let y = Math.round(evt.clientY - rect.top) * this._yRatio;
          return {x: x, y: y};
      },//}}}
      _getRegionFromCoords: function(coords){
        let x = coords.x, y = coords.y;
        let canvasRegions = this.cache.canvasRegionForGraph;
        for(var i=0; i < canvasRegions.length; i++){
          let cr = canvasRegions[i]; 
          let xMin = cr.xOff;
          let xMax = cr.xOff + cr.width;
          let yMin = cr.yOff;
          let yMax = cr.yOff + cr.height;
          if(x > xMin && y > yMin && x < xMax && y < yMax){
            this._clearCanvas();
            this.drawGraph();
            cr.drawWithin(function(){
              cr.drawBounds();
            });
          }
        }
      },
      _clearCanvas: function(){ //{{{
        this.context.clearRect(0,0, this.canvas.width, this.canvas.height);
      },//}}}
      _showMouseCoords: function(coords){//{{{
        let t = this
        let msg = "(" + coords.x + ", " + coords.y + ")";
        let tms = t.context.measureText("(" + t.canvas.width + ", " + t.canvas.height + ")");
        t.context.clearRect(0, 0, tms.width, 50)
        t._writeMessage(msg, 0, 40);
      },//}}}
      _setMouseMoveListener: function(evt){//{{{
        let t = this;
        t.canvas.addEventListener('mousemove', function(evt){
          let coords = t._getPointerCoords(evt);
          t._showMouseCoords(coords);
          t._getRegionFromCoords(coords);
        });
      },//}}}
      _writeMessage: function(text, x, y){//{{{
        this.context.font = this._getOptions().font || "32px Arial";
        this.context.fillText(text, x, y);
      },//}}}
      drawGraph: function(){//{{{
        var t = this;
        for(var i=0; i < t.config.graphs.length; i++){
          let graphConf = t.config.graphs[i];
          let options   = t._getOptions();
          let regionConf  = t._regionForGraph(graphConf);
          let rWidth    = t._measurmentToPx(regionConf.width, t.canvas.width);
          let rHeight   = t._measurmentToPx(regionConf.height, t.canvas.height);
          let rXOff     = t._measurmentToPx(regionConf.xStart, t.canvas.width);
          let rYOff     = t._measurmentToPx(regionConf.yStart, t.canvas.height);
          
          let graphReg = new CanvasRegion(t.context, rXOff, rYOff, rWidth, rHeight);
          if(!t.cache.canvasRegionForGraph[i]){ // sus...
            t.cache.canvasRegionForGraph.push(graphReg);
          }
          graphReg.drawWithin(function(gr){
            if(graphConf.title){
              let textWidth = t.context.measureText(graphConf.title).width;
              t._setFillColor(graphConf.titleColor);
              t._writeMessage(graphConf.title, ((gr.width) / 2) - (textWidth / 2), gr.height * 0.075);
              t._setFillColor();
            }

            let dTopMargin    = 50; // pixels
            let dBottomMargin = 50;
            let dRightMargin  = 0;
            let dLeftMargin   = 0;

            let dr = new CanvasRegion(gr.context, dLeftMargin, dTopMargin, gr.width - dRightMargin - dLeftMargin, gr.height - dBottomMargin - dTopMargin)
            dr.drawWithin(function(drawingRegion){

              t._drawLine(0, dr.height, dr.width, dr.height); // x-axis

              let data = graphConf.dataRetrievalFn();

              let maxY = data.y.reduce(function(max, cur){
                let curMax = Math.max(...cur);
                return (curMax > max ? curMax : max);
              }, -Infinity);

              let minY = data.y.reduce(function(min, cur){
                let curMin = Math.min(...cur);
                return (curMin < min ? curMin : min);
              }, Infinity);
              
              let maxTextWidth = dr.context.measureText(maxY.toFixed(2)).width;
              t._drawGridLines(0, 0, minY, maxY, dr.width, dr.height, 5);

              let PADDING = 0.1; // Percent
              let STICKS  = 1 - PADDING;

              var widthPerStick   = dr.width * STICKS  / data.y.length;
              var paddingPerStick = dr.width * PADDING / data.y.length;

              new CanvasRegion(dr.context, widthPerStick / 2, 0, dr.width - maxTextWidth, dr.height).drawWithin(function(dataRegion){
                widthPerStick   = dataRegion.width * STICKS  / data.y.length;
                paddingPerStick = dataRegion.width * PADDING / data.y.length;

                let xOff = 0; // Point X Offset, incremented with each new candlestick
                for(var j=0; j < data.y.length; j++){
                  let dStick = data.y[j];
                  t._drawCandle(xOff, 0, minY, maxY, dataRegion.height, dStick, widthPerStick);
                  xOff += widthPerStick + paddingPerStick;
                }
              });
            });
          });
        }
      }
    }//}}}
    giraffe._setMouseMoveListener();
    giraffe.drawGraph();
    return giraffe;
  };

  $.fn.Giraffe = function(config) {//{{{
    let elem = this[0];
    if($(this).data("giraffe-id")){
      return window.Giraffe[$(elem).data("giraffe-id")]
    } else {
      let graph = new Giraffe(elem, config);
      $(elem).data("giraffe-id", window.Giraffe.length);
      window.Giraffe.push(graph);
      return graph
    }
  };//}}}

})(jQuery);
