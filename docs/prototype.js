/*
 * This file serves as an example of how the Giraffe library might be used
 * upon its completion. Serves the purpose of planning out the API
 */

"use strict";

// HTML5 Canvas element
let canvas = $("#canvas");

// Create graph. Passing in configuration.
var canvasGraphs = new Giraffe({
  graphs: [{
      type: "candlestick",
      region: "r1",
      dataRetrievalFn: function(params){
        /*
         * Params are nil on first run. If this.updateGraph(params)
         * is called then the params from that call are passed here.
         */
        if(params){
          // Example of the use of AJAX to update graph
          var data = $.ajax({
            url: "prices.json?" + params.urlParams, // params.urlParams is user defined
            dataType: "jsonp"
          });
          return data.responseJSON;
        } else {
          // [[high, low, open, close]...]
          return [[38, 35, 36, 37], [39, 36, 37, 38]]; // ...
        }
      },
      optionsRetrievalFn: function(params){
        // Non-required options
        return options: {
          title: "Prices",
          titleColor: "blue",
          font: "15px Arial",
          gridlines: {
            vertical: 10,
            horizontal: 10
          },
          // candlestick specific options
          candlestick: {
            increaseBodyColor: "#00FF00", // Defaults to green
            decreaseBodyColor: "purple",  // Defaults to red
            wickColor: "black"            // Defaults to black
          }
        }
      }
    }
  ],
  zones: [{
      name: "r1",
      xStart: "0",
      yStart: "0",
      width: "100%",
      height: "100%
    }
  ]
});
