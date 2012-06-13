$(function(){
	
	var HoneyProxy = {};
	
	_.extend(HoneyProxy, Backbone.Events);
	
	
	var Flow = Backbone.Model.extend({
		
	});
	
	var Traffic = Backbone.Collection.extend({
		  model: Flow
	});
	
	var traffic = new Traffic;
	
	function sendWS(msg){
		ws.send(JSON.stringify(msg));
	}
	var urlData = JSON.parse(decodeURIComponent(location.hash).replace("#",""));
	var ws = new WebSocket(urlData.ws);
	ws.onopen = function(e){
		sendWS({action:"auth",key:urlData.auth});
		log("Connection etablished");
	};
	
	ws.onmessage = function(o) {
		console.timeEnd("ws-send");
		var e = JSON.parse(o.data);
		switch(e.msg){
		case "Authenticated.":
			HoneyProxy.trigger("authenticated");
			break;
		case "read":
			console.timeEnd("fetch")
			console.profileEnd();
			if(e.id in Backbone._syncrequests)
			{
				var req = Backbone._syncrequests[e.id];
				clearTimeout(req.onError);
				req.success(e.data);
			}
			break;
		case "newflow":
			traffic.add(e.data);
			break;
		}
		
		log(e);
	};
		
	Backbone._syncrequests = {}
	
	Backbone.sync = function(method, model, options) {
		if(method != "read")
		{
			console.warn("only read is supported");
			return;
		}
			
		
		id = model.id ? model.id : "all";
		var msg = {action:"read", id: id};
		Backbone._syncrequests[id] = {onError: window.setTimeout(function(){options.error("WebSocket Timeout.");},5000),
									  success: options.success};
		console.time("ws-send");
		ws.send(JSON.stringify(msg));
		
	}
	HoneyProxy.on("authenticated",function(){
		console.time("fetch");
		console.profile();
		traffic.fetch();
	})
	
	var FlowView = Backbone.View.extend({
		template: _.template($("#template-flow").html()),
		tagName: "tr",
		render: function() {
			var html = this.template(this.model);
			this.$el.html(html);
			return this;
		}
	});
	
	var TrafficView = Backbone.Marionette.CollectionView.extend({
		  itemView: FlowView,
		  el: $("#traffic")
	});
	
	var trafficView = new TrafficView({collection: traffic});	

	
	//debug
	window.traffic = traffic;

	//traffic.on("all",function(f){console.warn(arguments)});
	
	function log(msg){
		//console.timeEnd(1);
		console.log(msg);
		//console.log(msg);
		//document.getElementById("log").innerText += msg+"\n";
		/*try {
		//data = JSON.parse(msg);
		var tbl = prettyPrint( msg );
		document.getElementById("log").insertBefore( tbl, document.getElementById("log").firstChild );
		//document.getElementById("log").innerText += data.msg+"\n";
		//document.getElementById("log").innerHTML += '<img src="data:image/png;base64,'+window.btoa(data.response.content)+'">"'
		} catch(e) {}*/
	};
});



//ws.send("ping");