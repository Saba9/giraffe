$(document).ready(function(){
  "use strict";
  var canvas = $("#graphCanvas");
  console.log(canvas.Giraffe({
    graphs: [{
      title: "Other Text",
      titleColor: "blue",
      type: "candlestick",
      dataRetrievalFn: function(params){
        return {
          x: [1, 2, 3, 4, 5, 6],
          y: [
            [30, 20, 22, 28],
            [29, 19, 21, 27],
            [28, 18, 20, 26],
            [29, 19, 21, 27],
            [31, 21, 23, 29],
            [32, 22, 24, 30]
        ]};
      }
    }]
  }));
});
