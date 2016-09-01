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

  let Giraffe = function(canvasElem, config){
    "use strict";

    // TODO: set canvas DPI by looking at devices DPI.
    // http://stackoverflow.com/a/15666143
    config = $.extend({
      graphs: [],
      zones: []
    }, config);

    let giraffe = {
      canvas: canvasElem,
      context: canvasElem.getContext('2d'), 
      config: config,
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
        if(graphConf.zone){
          for(var i=0; i < this.config.zones.length; i++){
            let zone = this.config.zones[i];
            if(zone.name === graphConf.zone){
              return zone;
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
      _showMouseChords: function(){//{{{
        let me = this;
        me.canvas.addEventListener('mousemove', function(evt){
          me.context.clearRect(0, 0, 200, 100)
          var rect = me.canvas.getBoundingClientRect();
          let x = Math.round(evt.clientX - rect.left);
          let y = Math.round(evt.clientY - rect.top);
          me._writeMessage("(" + x + ", " + y + ")", 40, 40);
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
          let config    = t._getOptions();
          let zoneConf  = t._regionForGraph(graphConf);
          let rWidth    = t._measurmentToPx(zoneConf.width, t.canvas.width);
          let rHeight   = t._measurmentToPx(zoneConf.height, t.canvas.height);
          let rXOff     = t._measurmentToPx(zoneConf.xStart, t.canvas.width);
          let rYOff     = t._measurmentToPx(zoneConf.yStart, t.canvas.height);

          if(graphConf.title){
            let textWidth = t.context.measureText(graphConf.title).width;
            t._setFillColor(graphConf.titleColor);
            this._writeMessage(graphConf.title, ((rWidth) / 2) + rXOff - (textWidth / 2), rHeight * 0.075 + rYOff);
            t._setFillColor();
          }

          let MARGIN = 50; // pixels
          t._drawLine(MARGIN + rXOff, rHeight + rYOff - MARGIN, rWidth + rXOff, rHeight + rYOff - MARGIN); // x-axis
          t._drawLine(MARGIN + rXOff, rYOff, MARGIN + rXOff, rHeight + rYOff - MARGIN); // y-axis

          let PADDING = 0.1;
          let STICKS  = 1 - PADDING;

          let bXOff   = MARGIN + rXOff;
          let bYOff   = rYOff;
          let bWidth  = rWidth  - bXOff;
          let bHeight = rHeight - MARGIN;

          let data = graphConf.dataRetrievalFn();

          let maxY = data.y.reduce(function(max, cur){
            let curMax = Math.max(...cur);
            return (curMax > max ? curMax : max);
          }, -Infinity);

          let minY = data.y.reduce(function(min, cur){
            let curMin = Math.min(...cur);
            return (curMin < min ? curMin : min);
          }, Infinity);

          let widthPerStick   = bWidth * STICKS  / data.y.length;
          let paddingPerStick = bWidth * PADDING / data.y.length;
          let pXOff = widthPerStick / 2; // Point X Offset, incremented with each new candlestick
          
          for(var i=0; i < data.y.length; i++){
            let dStick = data.y[i];
            let tXOff = pXOff + bXOff; // Total X Offset
            let tYOff = bYOff; // Total Y Offset
            this._drawCandle(tXOff, tYOff, minY, maxY, bHeight, dStick, widthPerStick);
            pXOff += widthPerStick + paddingPerStick;
          }
        }
      }
    }//}}}
    giraffe.drawGraph();
    // giraffe._showMouseChords();
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
