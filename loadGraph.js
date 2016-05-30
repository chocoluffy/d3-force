// == graph variables
// var rawNodes = []; // may contain redundant name object.
// var RdyNodes = []; // contains no redundant name object.
// var rawLinks = []; // contains source and target name instead of indexes.
// var RdyLinks = []; // contains source and target index, and value being normalized to 1-10.
// var topicHash = {}; // contains topic words and its frequency(only the first word).
// var minVal = 0;
// var maxVal = 0; // to normalize interactions value.
var currentTopicArr = []; // update by topic checkbox.
var circle_radius = 5;
// graph link width range: 1-25
// name2index {"Interest|Love": 3}
// linkedByIndex {"1,2": true}
// RdyNodes [{"name": "Public Figure| Donald"}]
// RawLinks [{"source": "Public Figure| Donald", "target": "Media | CCTV", "value": 1000}]
// RdyLinks [{"source":1, "target":2, "value":<1-16>}]
// freqHash {"1":9} #connections a node has.
// RdyfreqHash {"1":3.45} normalized freHash.

function updateGraphByTopic(rawNodes, rawLinks, topicHash, minVal, maxVal, arrFilter){
  console.log("============ update graph ===================");
  var newData = pipeRaw2Rdy(rawNodes, rawLinks, topicHash, minVal, maxVal);
  newRdyNodes = newData.RdyNodes;
  newRdyLinks = newData.RdyLinks;
  loadGraph(newRdyNodes, newRdyLinks, arrFilter);
};

/*
  when the first option is clicked, the topic will expand next level content.
 */
function FirstOneBoxExpand(){
  var checkboxDiv = $("#checkbox");
  var firstBoxInput = checkboxDiv.find("input:eq(0)");
  var data = [
      {
          label: 'Customer Service',
          children: [
              { label: 'Product Return' },
              { label: 'Customer Consulting' }
          ]
      },
      {
          label: 'Marketing',
          children: [
              { label: 'Brand Marketing' }
          ]
      }
  ];

  firstBoxInput.click(function(){
    if(this.checked){
      var firstDiv = checkboxDiv.find("div:eq(0)");
      $("<div id=treeview style='position: absolute; left: 140px; top: 50px;'></div>").appendTo(firstDiv);
      $('#treeview').tree({
        data: data,
        onCreateLi: function(node, $li) {
                $lielement = $li.find('.jqtree-title').after("<input type='checkbox' class='cb-element' checked='checked' />");
            }
      });
    }
    else{
      var firstDiv = checkboxDiv.find("div:eq(0)");
      firstDiv.find('#treeview').remove();
    }
  });    
};

/*
  From topicArr set return by query data, populate the checkbox options.
  topicArr ["Public Figure"] 
 */
function pplCheckBox(topicArr, rawNodes, rawLinks, topicHash, minVal, maxVal){
  topicArr.map(function(d, i){
    $("#checkbox").append("<div><label>" + d + "</label><input type='checkbox' id='checkbox" + i + "' class='cb-element' checked='checked'/></div><br>");
    var thisID = '#checkbox' + i;
    $(thisID).click(function(){
      console.log(d);
      if(this.checked){
        currentTopicArr.push(d);
        updateGraphByTopic(rawNodes, rawLinks, topicHash, minVal, maxVal, currentTopicArr);
      }
      else{
        var topicIndex = currentTopicArr.indexOf(d);
        currentTopicArr.splice(topicIndex, 1);
        updateGraphByTopic(rawNodes, rawLinks, topicHash, minVal, maxVal, currentTopicArr);
      }
      console.log(currentTopicArr, currentTopicArr.length);
    });
  });
  $("#checkbox").append("<label>Check All</label><input type='checkbox' id='checkall' checked='checked'/><br>");
  $('#checkall').click(function(event) {   
    if(this.checked) {
      // Iterate each checkbox
      $(':checkbox').each(function() {
        this.checked = true;                        
      });
      currentTopicArr = topicArr.slice(0);
      updateGraphByTopic(rawNodes, rawLinks, topicHash, minVal, maxVal, currentTopicArr);
    }
    else{
      $(':checkbox').each(function() {
            this.checked = false;                        
        });
      currentTopicArr = [];
    }
    console.log(currentTopicArr, currentTopicArr.length);
  });

  // should be improved upon for topic expansion.
  FirstOneBoxExpand();

};

/*
  populate rawNodes and rawLinks from data.
  data: data from Ajax request, raw.json.
 */
function pplRawNodesNLinks(data){
  var tmpRawNodes = [],
      tmpRawLinks = [],
      tmpTopicHash = {},
      tmpMinVal = 0,
      tmpMaxVal = 0;
  for (var i=0; i<data.analysis.results.length; i++){
    var item = data.analysis.results[i];
    var keyArr = item.key.split("|");
    if(keyArr.length == 4){
      var name1 = keyArr[0] + "|" + keyArr[1];
      var name2 = keyArr[2] + "|" + keyArr[3];
      
      // push topic words into topicHash, with their frequency.
      if(!tmpTopicHash[keyArr[0]]){
        tmpTopicHash[keyArr[0]] = 1;
      }
      else{
        tmpTopicHash[keyArr[0]] += 1;
      }
      if(!tmpTopicHash[keyArr[2]]){
        tmpTopicHash[keyArr[2]] = 1;
      }
      else{
        tmpTopicHash[keyArr[2]] += 1;
      }

    }
    else{
      console.log("key string does not have four field for splitting!");
    }

    var node1 = {"name": name1};
    var node2 = {"name": name2};
    var link = {"source": name1, "target": name2, "value": item.interactions};
    if(link.value < tmpMinVal){
      tmpMinVal = link.value;
    }
    else if(link.value > tmpMaxVal){
      tmpMaxVal = link.value;
    }

    tmpRawNodes.push(node1);
    tmpRawNodes.push(node2);
    tmpRawLinks.push(link);
  }
  return {
    "rawNodes": tmpRawNodes,
    "rawLinks": tmpRawLinks,
    "topicHash": tmpTopicHash,
    "minVal": tmpMinVal,
    "maxVal": tmpMaxVal
  }
}

/*
  arrFilter: what topics should stay.
 */
function filterData(nodesData, linksData, arrFilter){
  console.log("before filter, nodes: ", nodesData, nodesData.length);
  console.log("before filter, links: ", linksData, linksData.length);

  if(arrFilter.length > 0){ // need to filter nodesData and linksData to correspond to currentTopicArr.

    function nodeNameInArr(obj){
      return arrFilter.indexOf(obj.name.split('|')[0]) + 1; // if not in the array, will return -1.
    }

    // filter nodesData.
    var filteredNode = nodesData.filter(nodeNameInArr);

    function linkNameInArr(obj){
      var srcIndex = arrFilter.indexOf(obj.source.name.split('|')[0]);
      var tgtIndex = arrFilter.indexOf(obj.target.name.split('|')[0]);
      return srcIndex > -1 && tgtIndex > -1;
    }

    // filter linksData.
    var filteredLink = linksData.filter(linkNameInArr);

    console.log("finish filtering!", arrFilter, arrFilter.length);
  }
  else{
    filteredNode = [];
    filteredLink = [];
    console.log("empty graph!", arrFilter);
  }

  console.log("after filter, node: ", filteredNode, filteredNode.length);
  console.log("after filter link: ", filteredLink, filteredLink.length);

  return {
    "nodes": filteredNode,
    "links": filteredLink
  }
}

/*
  rawNodes: [{"name": "Public Figure|Donald"}, ...]
  rawLinks: [{"source": "Public Figure|Donald", "target": "Media|CCTV", "value": 1000}, ...]
  topicHash: {"public": 50, ...}
  minVal: min value for interaction field.
  maxVal: max value for interaction field.
  arrFilter: currentTopicArr, update by topic checkbox, ["Public Figure", ...]
 */
function pipeRaw2Rdy(rawNodes, rawLinks, topicHash, minVal, maxVal){
  var tmpRdyNodes = [];
  var tmpRdyLinks = [];

  // get RdyNodes. Try to remove redundant element using the most efficient way, as the for loop method is faster than function in an order of magnitude.
  var seen = {};
  var len = rawNodes.length;
  var j = 0;
  for(var i=0; i < len; i++){
    var objName = rawNodes[i].name;
    if(seen[objName] !== 1){
      seen[objName] = 1;
      tmpRdyNodes[j++] = rawNodes[i];
    }
  }

  // create a name2index hash mapping.
  var nameHash = {};
  for(var i=0; i<tmpRdyNodes.length; i++){
    nameHash[tmpRdyNodes[i].name] = i;
  };

  // some utility variables to calc normalized interactions value.
  var range = maxVal - minVal;
  var scaler = 24;

  // get RdyLinks. substitute name to index using nameHash.
  for(var i=0; i<rawLinks.length; i++){
    var rawVal = rawLinks[i].value;
    var nrmVal = (rawVal - minVal) / range * scaler + 1;
    var newLink = {"source": nameHash[rawLinks[i].source], "target": nameHash[rawLinks[i].target], "value": nrmVal};
    tmpRdyLinks[i] = newLink;
  }
  return {
    "RdyNodes": tmpRdyNodes,
    "RdyLinks": tmpRdyLinks
  }
}

/*
  data: data from ajax request.
  arrFilter: currentTopixArr as a filter to filter data.
 */
function dataInitialize(data){
  var rawNodes = []; // may contain redundant name object.
  var RdyNodes = []; // contains no redundant name object.
  var rawLinks = []; // contains source and target name instead of indexes.
  var RdyLinks = []; // contains source and target index, and value being normalized to 1-10.
  var topicHash = {}; // contains topic words and its frequency(only the first word).
  var minVal = 0;
  var maxVal = 0; // to normalize interactions value.
  var rawData = pplRawNodesNLinks(data);
  
  rawNodes = rawData.rawNodes;
  rawLinks = rawData.rawLinks;
  topicHash = rawData.topicHash;
  minVal = rawData.minVal;
  maxVal = rawData.maxVal;

  // only load the topic checkbox once.
  if($("#checkbox").children.length < 3){
    currentTopicArr = Object.keys(topicHash);
    pplCheckBox(Object.keys(topicHash), rawNodes, rawLinks, topicHash, minVal, maxVal);  
  }

  RdyData = pipeRaw2Rdy(rawNodes, rawLinks, topicHash, minVal, maxVal);
  RdyNodes = RdyData.RdyNodes;
  RdyLinks = RdyData.RdyLinks;

  loadGraph(RdyNodes, RdyLinks, currentTopicArr);
};

function loadGraph(nodes, links, arrFilter){

  // need to clear out the canvas!!
  $('svg').remove();

  var graph = {
    "nodes": nodes,
    "links": links
  };

  var width = 1080,
      height = 800;

  var color = d3.scale.category20();

  var force = d3.layout.force()
      .charge(-150)
      .linkDistance(200)
      .size([width, height]);

  var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height);
  
  force.nodes(graph.nodes)
      .links(graph.links);

  // force
  //     .nodes(graph.nodes)
  //     .links(graph.links);
      // .start();  

  var update = function(graphNodes, graphLinks){

    var link = svg.selectAll(".link")
        .data(graphLinks);

    link.enter().append("line")
        .attr("class", "link")
        .style("stroke-width", function(d) { return Math.sqrt(d.value); });

    link.exit().remove(); // update link data.

    var node = svg.selectAll(".node")
        .data(graphNodes);

    node.enter().append("circle")
        .attr("class", "node")
        .attr("r", circle_radius)
        .style("fill", function(d) { return color(d.group); })
        .call(force.drag);

    node.exit().remove(); // update node data.

    node.append("title")
        .text(function(d) { return d.name; });

    var text = svg.append("g").selectAll("text")
      .data(graphNodes);

    text.enter().append("text")
      .attr("x", 8)
      .attr("y", ".31em")
      .style("opacity", 0)
      .text(function(d) { return d.name; });

    text.exit().remove(); // update text data.

    force.on("tick", function() {
      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      node.attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });

      text.attr("transform", function(d){
        return "translate(" + d.x + "," + d.y + ")";
      });
    });

    var getFreqHash = function(freqlinks){
      console.log("freqlinks: ", freqlinks, freqlinks.length);
      var freqHash = {};
      var linkedByIndex = {}; // create a connected hash, {"1,2": true}.

      for(var i=0; i < freqlinks.length; i++){
        var el = freqlinks[i];
        if(Number.isInteger(el.source)){
          srcIndex = el.source;
          tgtIndex = el.target;
        }
        else{
          srcIndex = el.source.index;
          tgtIndex = el.target.index;
        }
        linkedByIndex[srcIndex + "," + tgtIndex] = true;
        if(!freqHash[srcIndex]){
          freqHash[srcIndex] = 1;
        }
        else{
          freqHash[srcIndex] += 1;
        }
        if(!freqHash[tgtIndex]){
          freqHash[tgtIndex] = 1;
        }
        else{
          freqHash[tgtIndex] += 1;
        }
      };
      console.log("before normalized, ", freqHash);
      return {
        "freqHash": freqHash,
        "linkedByIndex": linkedByIndex
      };
    };

    /*
      normalized the link value(circle radius) to 5-20
      freqash: {"1":9} #connections a node has.
      topPercentage: 0.5, find the node which has the number of links greater than the percentage.
     */
    var getRdyFreqHash = function(freqhash, topPercentage){
      var tmpRdyfreqHash = {};
      var freqValArr = Object.keys(freqhash).map(function(k) { return freqhash[k]; });
      var freqMin = Math.min.apply(null, freqValArr);
      var freqRange = Math.max.apply(null, freqValArr) - freqMin;
      var freqScaler = 15;
      var freqThreshold = topPercentage * freqRange + freqMin;

      Object.keys(freqhash).map(function(k){
        var nrmFreq = (freqhash[k] - freqMin) * freqScaler / freqRange + 5;
        tmpRdyfreqHash[k] = nrmFreq;
      });

      console.log("after normalized, RdyfreqHash: ", tmpRdyfreqHash);
      return {
        "rdyfreqhash": tmpRdyfreqHash,
        "freqthreshold": freqThreshold
      };
    };

    var isConnected = function(a, b, hash){
      return hash[a.index + "," + b.index] || hash[b.index + "," + a.index] || a.index == b.index;
    };

    function set_highlight(d, hash){ 
      if (highlight_trans<1)  {
          node.transition()
            .duration(200)
            .style("opacity", function(o) {
            // console.log(o);
            return isConnected(d, o, hash) ? 1 : highlight_trans;
          });

          text.transition()
            .duration(200)
            .style("font-size", function(o){
              if(o.index == d.index){
                return "16px";
              }
              else{
                return "12px";
              }
            })
            .transition()
            .duration(100)
            .style("font-weight", function(o){
              if(o.index == d.index){
                return 600;
              }
              else{
                return 400;
              }
            })
            .style("opacity", function(o) {
            return isConnected(d, o, hash) ? 1 : 0;
          });
          
          link.transition()
            .duration(200)
            .style("opacity", function(o) {
            return o.source.index == d.index || o.target.index == d.index ? 1 : highlight_trans;
          });   
        }
    };

    function exit_highlight(d, hash){
      node.transition()
        .duration(300)
        .style("opacity", function(o) {
        // console.log(o);
        return 1;
      });

      text.transition()
        .duration(300)
        .style("font-size", "12px")
        .style("font-weight", 400)
        .style("opacity", function(o) {
        return 0;
      });
      
      link.transition()
        .duration(300)
        .style("opacity", function(o) {
        return 1;
      });   
    }

    var freqHashObj = getFreqHash(graphLinks);
    var freqHash = freqHashObj.freqHash;
    var linkedByIndex = freqHashObj.linkedByIndex;
    var RdyfreqObj = getRdyFreqHash(freqHash, 0.5);
    var RdyfreqHash = RdyfreqObj.rdyfreqhash;
    var freqThreshold = RdyfreqObj.freqthreshold;

    node.transition()
      .duration(200)
      .attr("r", function(d, i){
        if(RdyfreqHash[d.index]){ // only update those existing nodes.
            return RdyfreqHash[d.index]; // not looking at the node array index, but object index!
        }
        else{
          return circle_radius;
        }
      })
      .style("fill", function(d, i){
        if(freqHash[d.index]){
          if(freqHash[d.index] > freqThreshold){
            return "#FFA500";
          }
          return "#1F77B4";
        }
        else{
            return "#1F77B4";
        }
      });

    text.transition()
      .duration(200)
      .attr("x", function(d, i){
        if(RdyfreqHash[d.index]){
          return 8 - circle_radius / 2 + RdyfreqHash[d.index] / 2;
        }
        else{
          return 8;
        }
    });

    node.on('mouseover', function(d){
      set_highlight(d, linkedByIndex);
    })
    .on('mouseout', function(d){
      exit_highlight(d, linkedByIndex);
    })
    .on('mousedown', function(d){
      set_highlight(d, linkedByIndex);
    })
    .on('mouseup', function(d){
      exit_highlight(d, linkedByIndex);
    })
    ;

    force.start();
  }    

  update(graph.nodes, graph.links);

  var DidFilter = function(){
    var afterFilterGraphData = filterData(graph.nodes, graph.links, arrFilter);
    update(afterFilterGraphData.nodes, afterFilterGraphData.links);
  };

  DidFilter();
    
}