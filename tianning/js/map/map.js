//全局变量
var MyMap,mytoolbar,geometryService,mygraphicsLayer;

//定义图层
var baseLayer,yingXiangLayer,textLayer;


//加载自定义模块
var navToolbar;

//存放点的数组
var points = [];
   


dojo.require("esri.map");

dojo.require("esri.geometry.Extent");                   //范围对象
dojo.require("esri.layers.ArcGISTiledMapServiceLayer"); //地图服务
dojo.require("esri.layers.DynamicMapServiceLayer");

dojo.require("esri.dijit.OverviewMap");                 //鹰眼
dojo.require("esri.dijit.Scalebar");                    //比例
dojo.require("esri.toolbars.navigation");               //导航

dojo.require("esri.tasks.geometry");
dojo.require("esri.toolbars.draw");
dojo.require("esri.tasks.QueryTask");   //查询
dojo.require("esri.tasks.query");
dojo.require("esri.tasks.GeometryService");
dojo.require("esri.dijit.editing.Add");
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.graphic");
dojo.require("dojo.json");
dojo.require("esri.dijit.InfoWindowLite");//加载info框
dojo.require("esri.dijit.OverviewMap");

dojo.require("esri.geometry.geodesicUtils");




//---------------------------------//
var AllLayer,park;

//用初始化加载地图的方法
function initMap() {

      esri.config.defaults.io.corsDetection = false;
			var infoWindow = new esri.dijit.InfoWindowLite({}, dojo.create("div"));
			infoWindow.startup();
        MyMap = new esri.Map("map", { logo: false, infoWindow: infoWindow,slider:false });
        dojo.connect(MyMap, "onLoad", function (MyMap) {
            var overviewMap = new esri.dijit.OverviewMap({ map: MyMap, attachTo: "bottom-right" });
            overviewMap.startup();
        });
        
        dojo.connect(MyMap, "click", function (MyMap) {
           
        });
        
        
        
        baseLayer = new esri.layers.ArcGISTiledMapServiceLayer(basemap); //dMapServiceLayer对象，解析arcgis的瓦片服务图层；MapConfig.imgMapUrl是layer对象的参数，请求发布地图服务的url，用来获取地图服务的数据来渲染
        MyMap.addLayer(baseLayer);	
        
        
        
        yingXiangLayer = new esri.layers.ArcGISTiledMapServiceLayer(videomap);
        MyMap.addLayer(yingXiangLayer);
        yingXiangLayer.hide();
        
        
        

        mygraphicsLayer = new esri.layers.GraphicsLayer();  //新建画布图层
		MyMap.addLayer(mygraphicsLayer);
		textLayer = new esri.layers.GraphicsLayer({id:"textLayer"});  //新建画布图层
		MyMap.addLayer(textLayer);
		
        mytoolbar = new esri.toolbars.Draw(MyMap);
		geometryService = new esri.tasks.GeometryService(geomertyserviceurl);
        dojo.connect(geometryService, "onLengthsComplete", outputDistance); 
        dojo.connect(geometryService, "onAreasAndLengthsComplete", outputAreaAndLength);
		navToolbar = new esri.toolbars.Navigation(MyMap);
		
		myevent();  //为对象注册事件
		
}

//用dojo的addOnLoad方法初始化地图
dojo.addOnLoad(dojoReadyFun);

function dojoReadyFun(){
    globle_odjoReady = true;
    initMap();      //初始化加载地图
    init();
}


function addToMap(evt) {
    //alert(evt1.geometry);
    mytoolbar.deactivate();
     var symbol;
    switch (evt.geometry.type)              //根据绘图的类型选择
    {  
        case "point":
        case "multipoint":
            symbol = new esri.symbol.SimpleMarkerSymbol();
            break;
        case "polyline":
            symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new esri.Color([255, 0, 0]), 5);
            break;
        default:
            symbol = new esri.symbol.SimpleFillSymbol();
            break;
    }
    var graphic = new esri.Graphic(evt.geometry, symbol);  //根据画笔类型和外观新建绘画
    mygraphicsLayer.add(graphic);                          //将画成的样子添加到地图上
   
    tongjichose(graphic); //将调用统计函数，将graphic记录的样子转为json格式传给后台
  

}

//得到距离
	function getLength (polyline) {
		var length = 0;
		require(["esri/geometry/geodesicUtils"], function(geodesicUtils) { 
			 length =geodesicUtils.geodesicLengths([polyline], esri.Units.KILOMETERS); 
		});
		return length;
    } 

//注册事件
function myevent() {
    //为指定的元素添加事件
    //dojo.connect(MyMap, 'onLoad', createToolbar); //地图加载后调用createToolbar函数
	   mygraphicsLayer.on("click", function (arg) {
		  ///查询信息窗口
	       MyMap.infoWindow.resize(275, 225);        //调整信息框的大小
	       //console.log(arg.graphic.attributes)
	       MyMap.infoWindow.setTitle('<b>'+arg.graphic.attributes.name+'</b>');   //设置信息框的标题
	       MyMap.infoWindow.setContent(
	    		   						'<span>建设地点：'+arg.graphic.attributes.adr+'</span></br>'
	    		   						+'<span>实施主体：'+arg.graphic.attributes.sszt+'</span></br>'
	    		   						+'<span>项目层次：'+arg.graphic.attributes.xmcc+'</span></br>'	
	    		   						+'<span>总投资：'+arg.graphic.attributes.tz+'万元</span></br>'
	    		   						+'<span>当月投资：'+arg.graphic.attributes.dytz+'万元</span></br>'
	    		   						+'<span>当前累计投资：'+arg.graphic.attributes.dqljtz+'万元</span></br>'
	    		   						+'<span>建设开始时间：'+arg.graphic.attributes.jskssj+'</span></br>'
	    		   						+'<span>建设结束时间：'+arg.graphic.attributes.jsjssj+'</span></br>'
	    		   						//+'<a href="http://58.216.140.181:8181/xbproject/manager/view/projects_detail.html?type=update&id='+arg.graphic.attributes.id+'&pageIndex=1&pageSize=10">详情</a>'
	    		   						);
	       MyMap.infoWindow.show(arg.mapPoint, MyMap.getInfoWindowAnchor(arg.graphic.geometry));   //根据定位点的坐标，把特性展现出来
	   });
	   
	   
	   //map的点击事件
	   	

}





function mercator2lonlat(param_x,param_y){
	var lonlat={x:0,y:0};
	var x = param_x/20037508.34*180;
	var y = param_y/20037508.34*180;
	y= 180/Math.PI*(2*Math.atan(Math.exp(y*Math.PI/180))-Math.PI/2);
	lonlat.x = x;
	lonlat.y = y;
	return lonlat;
}



//
function tongjichose(graphic){
   var jsongraphic=JSON.stringify(graphic.toJson());//将绘图数据转为json格式
      $("#mapdetail").val("aaa");
      document.getElementById("mapdetail").value=jsongraphic;
//alert(document.getElementById("mapdetail").value);
     
}
//绘图点击事件
function drawpolygon(){
	  mygraphicsLayer.clear();
	  mytoolbar.activate(esri.toolbars.Draw.POLYGON);
}


function mapClear(){
	mygraphicsLayer.clear();
	MyMap.graphics.clear();
	$("#mapdetail").val('');
}
function resultAdd(arg){
	//$("#mapdetail").val(arg);
	mygraphicsLayer.clear();

	var globle_result=eval('(' + arg + ')');
	arg = globle_result;
	//data.data.data[0].geometry
	//$("#mapdetail").val(arg.data.data[0].geometry);
	//var item = arg.data.data[0].geometry;
			var rlen=arg.data.data.length;
			for(var i=0;i<rlen;i++){
					var glen=arg.data.data[i].geometry.ordinates.length;
					var coordary=[];
					//var coordary_wkg=[];
					for(var j=0;j<glen;j++){
						var nowary=[arg.data.data[i].geometry.ordinates[j],arg.data.data[i].geometry.ordinates[j+1]];
						coordary.push(nowary);
						j++;
					}
				        //var graphicm =  new esri.geometry.Polygon(coordary);
						var graphicm =  new esri.geometry.Polygon(MyMap.spatialReference);
				        graphicm.addRing(coordary);
				        var symbolm;
						symbolm = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 205, 0]), 1), new dojo.Color([0, 205, 0, 0.15]));
				     	var graphic = new esri.Graphic(graphicm, symbolm);
				     	mygraphicsLayer.add(graphic);
						//var cp=graphic.geometry.getExtent().getCenter();
						//var graphicpp = new esri.Graphic(cp);
						//mygraphicsLayer.add(graphicpp);
						MyMap.centerAndZoom(graphic.geometry.getExtent().getCenter(),14);
						tongjichose(graphic)
			}
			
			
		
}
function ajaxRequst_get(url, backfunction) {
	var xmlhttp;
	if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp = new XMLHttpRequest();
	}
	else {// code for IE6, IE5
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange = function () {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			backfunction(xmlhttp.responseText);
		}
	};
	var newpa="";
	if(url.indexOf("?")>-1){
		newpa=url.substring(0,url.indexOf("?"))+"?";
		url=url.substring(url.indexOf("?")+1);
		
		var pa=url.split("&");
		
		for(var i=0;i<pa.length;i++){
			var mn=pa[i].split("=");
			newpa+=mn[0]+"="+encodeURIComponent(mn[1])+"&";
			//newpa+=mn[0]+"="+mn[1]+"&";
			
		}

	}else{
		newpa=url;
	}
	newpa=newpa+"t="+new Date().getTime();
	newpa=encodeURI(newpa);
	xmlhttp.open("GET", newpa, true);
	xmlhttp.send();
}
function doData(arg){
	alert(arg)
}


//兴趣点
function searchByKey(){
	$.getJSON("http://restapi.amap.com/v3/assistant/inputtips?key=1376afac41aa27e8f13d8f1494bbacb5&keywords="+$("#keyword").val()+"&output=JSON&callback=?", 
	function(data) {
//		$("#lists").html('');
//		var str = '';
//		for(var i=0;i<data.tips.length;i++){
//			str = str+'<option value="'+data.tips[i].name+'">';
//		}
//		//alert(str)
//		$("#lists").html(str);
		
	});
}

function searchLocation(){
	//alert(arg)
	$.getJSON("http://restapi.amap.com/v3/assistant/inputtips?key=1376afac41aa27e8f13d8f1494bbacb5&keywords="+$("#keyword").val()+"&output=JSON&callback=?", 
			function(data) {
		//showAtMap(data)	
		showAtList(data);
	});
}

function showAtMap(arg){
	//for(var i=0;i<arg.tips.length;i++){
		//处理localtion
			var arr = [];
		
			arr = arg.tips[0].location.split(',');
		
			var graphicm =  new esri.geometry.Point([arr[0],arr[1]]);
			
	        var symbolm = new esri.symbol.PictureMarkerSymbol('../images/go.png', 24,36);
	        
	     	var graphic = new esri.Graphic(graphicm, symbolm,{ 
	     		"adcode": arg.tips[0].adcode, 
	     		"address": arg.tips[0].address, 
	     		"district":arg.tips[0].district,	
	     		"id":arg.tips[0].id,				
	     		"location":arg.tips[0].location,	
	     		"name":arg.tips[0].name, 
	     		"typecode":arg.tips[0].typecode
	     		});	//实施主体
	        mygraphicsLayer.add(graphic);
			//再添加点标记
			viewPoiToEarth(arr[0], arr[1], arg.tips[0].name,arg.tips[0].address)
	//}
}

function viewPoiToEarth(x,y,name,adr) {
    //var point = new esri.geometry.Point([x, y],MyMap.spatialReference);
    var point = new esri.geometry.Point([x, y]);
    MyMap.infoWindow.resize(275, 100);
    MyMap.infoWindow.setTitle('<span style="font-weight:800;">标题:</span>'+name);
    MyMap.infoWindow.setContent('<span style="font-weight:800;">地址：</span><span style="font-weight:blod;">'+adr+'</span>');
    MyMap.infoWindow.show(point, MyMap.getInfoWindowAnchor(point));
    //MyMap.centerAt(point);
    MyMap.centerAndZoom(point,16);
}

//投影转经纬度
function mercator2lonlat(param_x,param_y){
	var lonlat={x:0,y:0};
	var x = param_x/20037508.34*180;
	var y = param_y/20037508.34*180;
	y= 180/Math.PI*(2*Math.atan(Math.exp(y*Math.PI/180))-Math.PI/2);
	lonlat.x = x;
	lonlat.y = y;
	return lonlat;
}

function showAtList(arg){
	var str = '';
	for(var i=0;i<arg.tips.length;i++){
		var name = arg.tips[i].name;
		str = str + '<div onclick="showById(\''+name+'\')"> <i class="fa fa-map-marker"></i> <a>'+name+'</a></div>';
	}
	$("#map_list").html(str);
}

function showById(arg){
	//点击 然后定位
	$.getJSON("http://restapi.amap.com/v3/assistant/inputtips?key=1376afac41aa27e8f13d8f1494bbacb5&keywords="+arg+"&output=JSON&callback=?", 
			function(data) {
		//showAtMap(data)	
		showAtMap(data);
	});
}

function init(){
	var point = new esri.geometry.Point([119.974991, 31.779619]);
	 MyMap.centerAndZoom(point,14);
}
