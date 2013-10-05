// Fuse dependencies
var Utils = function() {
	var utils = {};

	utils.convertToHeading = function(number) {
		var heading = number%360;
		return (heading < 0) ? heading+360:heading;
	}

	utils.convertToNumber = function(heading) {
		if (heading > 180) {
			return heading-360;
		} else {
			return heading;
		}
	}

	utils.headingDifference = function(headingOne, headingTwo) {
		var angle = (Math.abs(headingOne - headingTwo))%360;
		if(angle > 180) {
			angle = 360 - angle;
		}
		return angle;
	}

	return utils;
}();
var Viewport = function(container) {
	var _width = 400;
	var _height = 300;
	var currentScale = 1;
	var scaleIncrements = [.25, .5, 1];

	var viewport = new createjs.Container();
	viewport.name = 'viewport';

	container.x = _width/2;
	container.y = _height/2;

	viewport.addChild(container);

	function changeScale(inc) {
		currentScale += inc;
		var nextScale = Math.abs(currentScale%scaleIncrements.length);
		createjs.Tween.get(container, {override:true})
			.to({scaleX:scaleIncrements[nextScale], scaleY:scaleIncrements[nextScale]}, 1000, createjs.Ease.sineOut)
	}

	viewport.__defineGetter__('width', function(){
		return _width;
	});

	viewport.__defineSetter__('width', function(val){
		viewport.canvasSizeChanged(val,_height);
		return _width;
	});

	viewport.__defineGetter__('height', function(){
		return _height;
	});

	viewport.__defineSetter__('height', function(val){
		viewport.canvasSizeChanged(_width,val);
		return _height;
	});

	viewport.canvasSizeChanged = function(width,height) {
		console.log('canvasSizeChanged', width, height);
		_width = width;
		_height = height;

		container.x = width/2;
		container.y = height/2;
	}

	viewport.zoomIn = function() {
		changeScale(1);
	}

	viewport.zoomOut = function() {
		changeScale(-1);
	}

	return viewport;
}
// Main world class
var World = function(){
	
	var bubbleTick = 0;

	var world = new createjs.Container();
	world.name = 'world';

	var map = world.map = new createjs.Container();
	var ocean = world.ocean = new Ocean(500,500);
	var weather = world.weather = new Weather();
	var playerBoat = world.playerBoat = new PlayerBoat();

	var island = new createjs.Bitmap("images/island.png");
	island.y = -2000;

	var mapCenter = new createjs.Shape();
	mapCenter.graphics.beginFill('#F00');
	mapCenter.graphics.drawCircle(-5,-5,20);
	mapCenter.graphics.endFill();

	map.addChild(mapCenter, island, playerBoat)
	world.addChild(ocean, map);

	createjs.Ticker.addEventListener("tick", update);
	function update() {
		var heading = playerBoat.getHeading();
		var speed = playerBoat.getSpeed();

		document.getElementById('heading').innerHTML = "Heading: "+Math.round(heading);
		document.getElementById('knots').innerHTML = "Knots: "+Math.round(speed);
		
		// Boat x and y changes based on speed
		var knotConversion = speed*.3;
		var xPos = Math.sin(heading*Math.PI/180)*knotConversion;
		var yPos = Math.cos(heading*Math.PI/180)*knotConversion;

		// Camera animation based on speed
		var xSpeed = Math.round(xPos*60);
		var ySpeed = Math.round(yPos*60);
		createjs.Tween.get(map, {override:true})
			.to({x:-xSpeed, y:ySpeed}, 1000, createjs.Ease.sineOut)
		createjs.Tween.get(ocean, {override:true})
			.to({x:-xSpeed, y:ySpeed}, 1000, createjs.Ease.sineOut)

		// Update relative positions
		map.regX += xPos;
		map.regY -= yPos;
		playerBoat.x += xPos;
		playerBoat.y -= yPos;
		ocean.position.x -= xPos;
		ocean.position.y += yPos;

		bubbleTick += Math.round(speed);
		if (bubbleTick >= 7) {
			bubbleTick = 0;
			ocean.spawnBubble();
		}

		playerBoat.update();
		ocean.update();
	}

	return world;
}
var Gauge = function() {
	var gauge = new createjs.Container();
	gauge.width = gauge.height = 100;

	var windCircle = new createjs.Bitmap("images/windgauge.png");
	var compass = new createjs.Bitmap("images/compass.png");
	var needle = new createjs.Bitmap("images/needle.png");

	windCircle.regX = compass.regX = needle.regX = gauge.width/2;
	windCircle.regY = compass.regY = needle.regY = gauge.height/2;

	gauge.addChild(windCircle, compass, needle);

	gauge.update = function() {
		windCircle.rotation = Game.world.weather.wind.direction;
		needle.rotation = Game.world.playerBoat.getHeading();
	}

	return gauge;
}
var Ocean = function(width, height){
	//Constants
	var MAX_TIDE_SPEED = 10;

	var _tideXVelocity = 0;
	var _tideYVelocity = 0;

	var ocean = new createjs.Container();
	ocean.width = width;
	ocean.height = height;
	ocean.position = {x:0, y:0};

	var crossWidth = width*3 + height*3;

	var tide = new createjs.Shape();
	var g = tide.graphics;
	g.beginBitmapFill(Game.assets['waves']);
	g.drawRect(-crossWidth, -crossWidth, crossWidth*2, crossWidth*2);

	var underwater = new createjs.Container();

	ocean.addChild(underwater, tide);

	function moveTide() {
		tide.x = ocean.position.x % 200;
		tide.y = ocean.position.y % 150;
	}

	ocean.spawnBubble = function() {
		var bubble = new Bubble();
		bubble.x = -ocean.position.x;
		bubble.y = -ocean.position.y;
		bubble.animate();
		underwater.addChild(bubble);
	}

	ocean.update = function() {
		document.getElementById('coords').innerHTML = ('x:'+ocean.position.x+' - y:'+ocean.position.y);
		underwater.x = ocean.position.x;
		underwater.y = ocean.position.y;
		moveTide();
	}

	return ocean;
}

var Bubble = function() {
	var _floatVariance = 100;
	var bubble = new createjs.Shape();
	
	bubble.graphics.beginFill('#95cbdc');
	bubble.graphics.drawCircle(-5,-5,10);
	bubble.graphics.endFill();

	bubble.scaleX = bubble.scaleY = .1;
	function pop() {
		bubble.parent.removeChild(bubble);
	}

	function getRandomArbitary (min, max) {
		return Math.random() * (max - min) + min;
	}

	bubble.animate = function() {
		var floatX = getRandomArbitary(-_floatVariance,_floatVariance)+bubble.x;
		var floatY = getRandomArbitary(-_floatVariance,_floatVariance)+bubble.y;
		var scale = getRandomArbitary(1,3);
	
		createjs.Tween.get(bubble,{loop:false})
			.set({scaleX:0.1,scaleY:0.1}, bubble)
			.to({
				x: floatX,
				y: floatY,
				scaleX: scale,
				scaleY: scale,
				alpha: 0
			},3000,createjs.Ease.easeOut)
			.call(pop);
	}
	return bubble
}

var Weather = function(){
	var weather = {
		wind: {
			speed: 10,
			direction: 45
		}
	};

	return weather;
}
var Boat = (function() {
	var WIDTH = 56;
	var LENGTH = 125;
	var SPEED = 10;
	var AGILITY = 1;

	var _turningLeft = false;
	var _turningRight = false;
	var _speed = 0;
	var _heading = 0;
	var _trim = 0;
	var _furled = true;

	var oldWindHeading = 0;

	var boat = new createjs.Container();
	boat.regX = WIDTH/2;
	boat.regY = LENGTH/2;

	var hull = new createjs.Bitmap('images/small_boat.png');
	var helm = new Helm();
	var squareRig = new SquareRig(WIDTH*1.5, {x:10,y:LENGTH/2+20}, {x:WIDTH-10,y:LENGTH/2+20});
	var mainSail = new ForeAft(LENGTH*.5, {x:WIDTH/2,y:LENGTH-20});
	squareRig.x = WIDTH/2;
	mainSail.x = WIDTH/2;
	squareRig.y = 45;
	mainSail.y = 55;

	boat.sails = [squareRig,mainSail];

	boat.addChild(hull, squareRig, mainSail);

	boat.turnLeft = helm.turnLeft;
	boat.turnRight = helm.turnRight;

	function speedCalc() {
		var potentialSpeed = 0;
		boat.sails.map(function(sail){
			potentialSpeed += sail.power;
		});
		potentialSpeed = (potentialSpeed/boat.sails.length)*SPEED;
		if (_speed != potentialSpeed) {
			if (_speed > potentialSpeed) {
				_speed -= .01;
			} if (_speed < potentialSpeed) {
				_speed += .05;
			}
		}
	}

	function adjustTrim() {
		var windHeading = Utils.convertToHeading(Game.world.weather.wind.direction - boat.rotation);
		squareRig.trim(windHeading);
		mainSail.trim(windHeading);
	}

	boat.stopTurning = function(){
		helm.stopTurning();
		boat.rotation = Math.round(boat.rotation);
	}

	function furlSails() {
		squareRig.reef();
		mainSail.reef();
	}

	function hoistSails() {
		squareRig.hoist();
		mainSail.hoist();
		adjustTrim();
	}

	boat.toggleSails = function() {
		if (_furled) {
			hoistSails();
		} else {
			furlSails();
		}
		_furled = !_furled;
	}

	boat.getSpeed = function() {
		return _speed;
	}

	boat.getWidth = function() {
		return WIDTH;
	}

	boat.getLength = function() {
		return LENGTH;
	}

	boat.getHeading = function() {
		var heading = boat.rotation%360;
		return (heading < 0) ? heading+360:heading;
	}

	boat.getSternPosition = function() {
		return LENGTH-boat.regY;
	}

	boat.update = function() {
		speedCalc();
		var turnAmount = helm.turnAmount*AGILITY;
		var windChange = oldWindHeading-Game.world.weather.wind.direction;
		if (turnAmount !== 0 || windChange !== 0) {
			//console.log(windChange);
			oldWindHeading = Game.world.weather.wind.direction;
			if (turnAmount !== 0) {
				var newHeading = (boat.rotation+turnAmount)%360
				boat.rotation = (newHeading < 0) ? newHeading+360:newHeading;
			}
			
			if (!_furled) {
				adjustTrim();
			}
		}
	}

	return boat;
});
var PlayerBoat = function() {
	var boat = new Boat();

	Game.addEventListener('onKeyDown', function(event) {
		//console.log(event.key);
		switch(event.key) {
			case 37: // Left arrow
				boat.turnLeft();
				break;
			case 39: // Right arrow
				boat.turnRight();
				break;
		}
	});

	Game.addEventListener('onKeyUp', function(event) {
		switch(event.key) {
			case 83: // S Key
				boat.toggleSails();
				break;
			case 37: // Right arrow
			case 39: // Left arrow
				boat.stopTurning();
				break;
		}
	});

	return boat;
}
var Sail = (function(windOffset, sailRange, noSail) {
	var _optimalAngle =  180;
	var _maxAngle = 50;
	var trimAngle = 180-windOffset;
	var _power = 0;
	var _reefed = true;

	var windToBoat = 0;

	var sail = new createjs.Container();

	function updateSail() {
		var sailHeading = Utils.convertToHeading(sail.angle);
		var angleFromWind = Utils.headingDifference(windToBoat, sailHeading);
		if (sail.name == "fore-aft") {
			//console.log(angleFromWind+' | '+noSail);
		}
		var leeway = 10
		if (angleFromWind > noSail+leeway) {
			_power = 0;
		} else {
			var distanceFromTrim = Math.abs(trimAngle-angleFromWind);
			var power = (noSail - distanceFromTrim)/noSail;
			_power = power;
		}
		if (sail.drawSail) sail.drawSail();
	}

	sail.hoist = function() {
		_reefed = false;
	}

	sail.reef = function() {
		_reefed = true;
		sail.angle = 0;
	}

	sail.trim = function(windHeading) {
		windToBoat = windHeading;
		//console.log('Trim for wind: ', windHeading);
		var nosail = (Math.abs(Utils.convertToNumber(windHeading)) > noSail);
		if (nosail) { // in irons
			sail.angle = 0;
		} else {
			var offset = (windHeading > 180) ? trimAngle : -trimAngle;
			sail.angle = Utils.convertToNumber(windHeading+offset);
		}
	}

	sail.__defineSetter__('angle', function(desiredAngle){
		//console.log('set angle: ', desiredAngle);
		var actualAngle = desiredAngle;
		if (desiredAngle < -sailRange) {
			actualAngle = -sailRange;
		} else if (desiredAngle > sailRange) {
			actualAngle = sailRange;
		}
		createjs.Tween.get(sail, {override:true})
			.to({rotation:actualAngle}, 2000, createjs.Ease.linear)
			.addEventListener("change", updateSail);
	});

	sail.__defineGetter__('angle', function(){
		return sail.rotation;
	});

	sail.__defineGetter__('power', function(){
		return (_reefed) ? 0 : _power;
	});

	sail.__defineGetter__('tack', function(){
		return (windToBoat > 180) ? 'port' : 'starboard';
	});

	return sail;
});

var SquareRig = function(length, anchor1, anchor2) {
	var sail = new Sail(180, 26, 90);
	sail.name = 'square';
	var sheet_luff = 20;
	
	var sheet = new	createjs.Shape();
	var yard = new createjs.Shape();

	var anchorPoint1 = new createjs.Shape();
	var anchorPoint2 = new createjs.Shape();

	anchorPoint1.x = -(length/2)+10;
	anchorPoint2.x = length/2-10;
	anchorPoint1.y = anchorPoint2.y = -5;

	yard.graphics.beginFill('#52352A');
	yard.graphics.drawRoundRect(-(length/2),-6, length, 6, 4);
	yard.graphics.endFill();

	sail.addChild(anchorPoint1, anchorPoint2, sheet, yard);

	function drawLines() {
		var g1 = anchorPoint1.graphics;
		var g2 = anchorPoint2.graphics;
		g1.clear();
		g2.clear();
		g1.setStrokeStyle('2').beginStroke('#ded2b3');
		g2.setStrokeStyle('2').beginStroke('#ded2b3');
		
		var anchorOne = sail.parent.localToLocal(anchor1.x,anchor1.y, anchorPoint1);
		var anchorTwo = sail.parent.localToLocal(anchor2.x,anchor2.y, anchorPoint2);

		g1.moveTo(0,0);
		g2.moveTo(0,0);
		g1.lineTo(anchorOne.x, anchorOne.y);
		g2.lineTo(anchorTwo.x, anchorTwo.y);
		g1.endStroke();
		g2.endStroke();
	}

	sail.drawSail = function() {
		var g = sheet.graphics;
		g.clear();
		g.beginFill('#FFF');
		if (sail.power > 0) {
			var luffAmount = -(sail.power*sheet_luff);
			g.moveTo(-(length/2), -5);
			g.curveTo(-(length*.4), luffAmount/2, -(length*.4), luffAmount);
			g.curveTo(0, luffAmount*2, length*.4, luffAmount);
			g.curveTo(length*.4, luffAmount/2, length/2, -5);
			g.lineTo(-(length/2), -5);
		}
		g.endFill();
		drawLines();
	}

	return sail;
}

var ForeAft = function(length, anchorPoint) {
	var sail = new Sail(45, 60, 135);
	sail.name = 'fore-aft';

	var sheet = new	createjs.Shape();
	var boom = new createjs.Shape();

	var anchorLine = new createjs.Shape();
	anchorLine.y = length-10;

	boom.graphics.beginFill('#52352A');
	boom.graphics.drawRoundRect(-3, 0, 6, length, 4);
	boom.graphics.endFill();

	sail.addChild(anchorLine, boom, sheet);

	function drawLine() {
		var g = anchorLine.graphics;
		g.clear();
		g.setStrokeStyle('2').beginStroke('#ded2b3');
		
		var anchor = sail.parent.localToLocal(anchorPoint.x,anchorPoint.y, anchorLine);

		g.moveTo(0,0);
		g.lineTo(anchor.x, anchor.y);
		g.endStroke();
	}

	sail.drawSail = function() {
		var g = sheet.graphics;
		g.clear();
		g.beginFill('#FFF');
		g.moveTo(0, 0);
		var power = (sail.tack == 'port') ? sail.power : -sail.power;
		g.curveTo(power*-30, length*.9, 0, length);
		g.lineTo(0,0);
		g.endFill();
		drawLine();
	}

	return sail;
}
var Helm = function(turnSpeed) {
	var TURN_SPEED = turnSpeed || 100;
	var MAX_AMOUNT = 100;

	var helm = {};
	var _turning = false;
	var _amount = 0;

	helm.turnLeft = function() {
		_turning = true;
		if (_amount > -MAX_AMOUNT) {
			_amount -= TURN_SPEED;
		}
	}

	helm.turnRight = function() {
		_turning = true;
		if (_amount < MAX_AMOUNT) {
			_amount += TURN_SPEED;
		}
	}

	helm.stopTurning = function() {
		_turning = false;
	}

	helm.__defineGetter__('turnAmount', function(){
		return _amount/MAX_AMOUNT;
	});

	setInterval(function() {
		if (!_turning) {
			if (_amount > 0) {
				_amount -= TURN_SPEED;
			} else if (_amount < 0) {
				_amount += TURN_SPEED;
			}
		}
	}, 100);

	return helm;
}



// Parent Game Logic
var Game = (function(){
	var game = {}
	var _preloadAssets = [];
	var _canvas;

	var dispatcher = createjs.EventDispatcher.initialize(game);

	var stage;
	var viewport;
	var world;
	var gauge;
	var preloader;

	game.init = function(canvasId) {
		stage = new createjs.Stage(document.getElementById(canvasId));

		//Enable User Inputs
		createjs.Touch.enable(stage);
		stage.enableMouseOver(10);
		stage.mouseMoveOutside = false; // keep tracking the mouse even when it leaves the canvas
		stage.snapToPixelEnabled = true;

		manifest = [
			{src:"images/tide_repeat.png", id:"waves"}
		];

		preloader = new createjs.LoadQueue(false);
		preloader.onFileLoad = fileLoaded;
		preloader.onComplete = startGame;
		preloader.loadManifest(manifest);
	}

	function fileLoaded(event) {
		console.log('handleFileLoad: ', event);
		_preloadAssets.push(event.item);
	}

	function startGame() {
		console.log('startGame')
		game.assets = {};
		for (var i = 0; i < _preloadAssets.length; i++) {
			console.log(_preloadAssets[i]);
			game.assets[_preloadAssets[i].id] = preloader.getResult(_preloadAssets[i].id);
		};
		console.log('Game.assets', game.assets);

		var world = game.world = new World();
		viewport = new Viewport(world);
		gauge = new Gauge();

		viewport.width = stage.canvas.width;
		viewport.height = stage.canvas.height;
		gauge.x = stage.canvas.width - 75;
		gauge.y = stage.canvas.height - 75;

		stage.addChild(viewport,gauge);
		
		//Ticker
		createjs.Ticker.setFPS(60);
		createjs.Ticker.addEventListener("tick", tick);

		sizeCanvas();
	}

	function sizeCanvas() {
		if (viewport) {
			stage.canvas.width = window.innerWidth;
			stage.canvas.height = window.innerHeight;
			viewport.canvasSizeChanged(stage.canvas.width, stage.canvas.height);
			gauge.x = stage.canvas.width - 75;
			gauge.y = stage.canvas.height - 75;
		}
	}

	function onKeyDown(event) {
		switch(event.keyCode) {
			case 38: // Up arrow
				//Game.world.weather.wind.direction = Utils.convertToHeading(Game.world.weather.wind.direction+10);
				break;
			case 40: // Down arrow
				//Game.world.weather.wind.direction = Utils.convertToHeading(Game.world.weather.wind.direction-10);
				break;
			default:
				game.dispatchEvent({type:'onKeyDown', key:event.keyCode});
		}
	}

	function onKeyUp(event) {
		switch(event.keyCode) {
			case 187: // = key, Zoom In
				viewport.zoomIn();
				break;
			case 189: // - key, Zoom Out
				viewport.zoomOut();
				break;
			case 27: // Escape
				game.dispatchEvent('escape');
				break;
			default:
				game.dispatchEvent({type:'onKeyUp', key:event.keyCode});
		}
	}

	function tick() {
		gauge.update();
		//world.update();
		stage.update();
		document.getElementById('fps').innerHTML = Math.round(createjs.Ticker.getMeasuredFPS()) + " fps";
	}

	game.escape = function() {

	}

	$(document).ready(function(){
		console.log('DOCUMENT READY');
		window.onresize = sizeCanvas;
		window.onkeydown = onKeyDown;
		window.onkeyup = onKeyUp;
	});

	return game;
})();