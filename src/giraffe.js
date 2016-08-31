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
            return num;
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
      _getOptions: function() {
        if(typeof(this.config.optionsRetrievalFn) === "function"){
          return this.config.optionsRetrievalFn();
        } else {
          return new Object();
        }
      },
      draw: function(){
        for(var i=0; i < this.config.graphs.length; i++){
          let graphConf = this.config.graphs[i];
          let zoneConf = this._regionForGraph(graphConf);
          let rWidth = this._measurmentToPx(zoneConf.width, this.canvas.width);
          let rHeight = this._measurmentToPx(zoneConf.height, this.canvas.height);
          console.log(this.canvas.width + " " + this.canvas.height)
          let config = this._getOptions();

          if(graphConf.title){
            let textWidth = this.context.measureText(graphConf.title).width;
            console.log(textWidth)
            this.context.font = config.font || "12px Arial";
            this.context.strokeText(graphConf.title, (rWidth / 2) - (textWidth / 2), rHeight * 0.075);
          }
        }
      }
    }
    giraffe.draw();
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
