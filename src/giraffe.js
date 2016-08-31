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
      _parseMeasurment: function(measurment){
        let matches = /(\d*)\s*([a-zA-Z%]*)/.exec(measurment);
        return [matches[1], matches[2]]
      },
      _measurmentToPx: function(measurment, maximum){
        let parsed = this._parseMeasurment(measurment);
        let num = parsed[0];
        let units = parsed[1];
        if(units === "%"){
          return (num / 100) * maximum;
        } else {
            return parseInt(num);
        }
      },
      _regionForGraph: function(graphConf){
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
      },
      _setFillColor: function(color){
        if(color){
          this.context.fillStyle = color;
        } else {
          this.context.fillStyle = "black";
        }
      },
      _getOptions: function() {
        if(typeof(this.config.optionsRetrievalFn) === "function"){
          return this.config.optionsRetrievalFn();
        } else {
          return new Object();
        }
      },
      _drawLine: function(x1, y1, x2, y2){
        this.context.beginPath();
        this.context.moveTo(x1, y1);
        this.context.lineTo(x2, y2);
        this.context.stroke();
      },
      drawGraph: function(){
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
            t.context.font = config.font || "32px Arial";
            t._setFillColor(graphConf.titleColor);
            t.context.fillText(graphConf.title, ((rWidth) / 2) + rXOff - (textWidth / 2), rHeight * 0.075 + rYOff);
            t._setFillColor();
          }

          let MARGIN = 50; // pixels
          t._drawLine(MARGIN + rXOff, rHeight + rYOff - MARGIN, rWidth + rXOff, rHeight + rYOff - MARGIN); // y-axis
          t._drawLine(MARGIN + rXOff, MARGIN + rYOff, MARGIN + rXOff, rHeight + rYOff - MARGIN); // x-axis

          let PADDING = 0.1;
          let STICKS  = 1 - PADDING;

          let bXOff   = MARGIN + rXOff;
          let bYOff   = MARGIN + rYOff;
          let bWidth  = rWidth  - bXOff;
          let bHeight = rHeight - bYOff;

          let data = graphConf.dataRetrievalFn();

          let maxY = data.y.reduce(function(max, cur){
            let curMax = Math.max(...cur);
            return (curMax > max ? curMax : max);
          }, -Infinity);

          let widthPerStick   = bWidth * STICKS  / data.length;
          let paddingPerStick = bWidth * PADDING / data.length;
        }
      }
    }
    giraffe.drawGraph();
    return giraffe;
  };

  $.fn.Giraffe = function(config) {
    let elem = this[0];
    if($(this).data("giraffe-id")){
      return window.Giraffe[$(elem).data("giraffe-id")]
    } else {
      let graph = new Giraffe(elem, config);
      $(elem).data("giraffe-id", window.Giraffe.length);
      window.Giraffe.push(graph);
      return graph
    }
  };

})(jQuery);
