// NOTE: Assumes jQuery is available

// LightGrid v1.0
var LightGrid = (function(){
	
	//Public Variables
	var difficulties = ["Easy","Normal","Hard"];
	var difficulty = difficulties[0];

	// Private Variables
	var lights = [];
	var timer;
	var timerRunning = false;
	var elaspedTime = 0;
	var rows = 4;
	var columns = 4;
	var scrambleAmount = 10;

	// Private Methods
	function buildLights() {
		$("#lights").removeClass("complete");
		var lightContainer = document.getElementById("lights");
		$('.light').remove( );
		var numOfLights = rows * columns;
		lightContainer.style.width = columns*60 + "px";
		for (var i = 0; i < numOfLights; i++) {
			var light = document.createElement('a');
			light.setAttribute('id', i);
			light.setAttribute('class', 'light');
			
    		$(light).bind("click" ,function(num) {
    	    	return function() {
    	        	clickLight(num);
    	    	}
    		}(i));
	
    		lightContainer.appendChild(light);
    		lights.push(light);
		}
	}

	function scrambleLights() {
		for (var i=0; i<scrambleAmount; i++) {
			var randomNum = Math.floor(Math.random()*lights.length);
			toggleLight(randomNum);
		}
		if ($("#lights a.off").length < 1) {
			scrambleLights();
		}
	}

	function toggleLight(index) {
		var lightsToToggle = adjacentLights(index);
		$(lights[index]).toggleClass("off");
		for (var i=0; i<lightsToToggle.length; i++) {
			$(lightsToToggle[i]).toggleClass("off");
		}
	}

	function clickLight(index) {
		if (!timerRunning) {
			startTimer();
		}
		toggleLight(index);
		if ($("#lights a.off").length < 1) {
			winCondition();
		}
	}

	function adjacentLights(index) {
		// Will return an array of elements next to the provided element
		var result = [];
		var column = index % columns;
    	var row = Math.floor( index / columns );
		for (var i=0; i<lights.length; i++) {
			var lightRow = Math.floor( i / columns );
			if (((i == index-1 || i == index+1) && lightRow == row) || /* left or right */
				(i == index - columns || i == index + columns)) { /* above or below */
				result.push( lights[i] );
			}
		}
		return result;
	}

	function startTimer() {
		timerRunning = true;
		timer = window.setInterval(addSecondToElapsedTime, 1000);
	}

	function stopTimer() {
		timerRunning = false;
		if (timer) {
			window.clearInterval(timer);
		}
	}

	function resetTimer() {
		elaspedTime = 0;
		$("#timer span.time").html( prettyTime(elaspedTime) );
	}

	function addSecondToElapsedTime() {
		elaspedTime += 1000;
		$("#timer span.time").html( prettyTime(elaspedTime) );
	}

	function prettyTime(milliseconds) {
		var seconds = milliseconds / 1000;
		var m = Math.floor(seconds/60);
		var s = Math.round(seconds - (m * 60));
	
		// Add leading zeros to one-digit numbers.
		if (m < 10) {
		  m = "0" + m;
		}
		if (s < 10) {
		  s = "0" + s;
		}

		return m + ":" + s ;
	}

	function winCondition() {
		$("#lights").addClass("complete");

		$('#lights .light').each(function(index) {
			$(this).unbind("click");
			$(this).addClass('fade');
		});

		stopTimer();
		saveScore();
		setMessage();
	}

	function setMessage() {
		var msg = "";
		if (window.localStorage.length > 0) {
			if (window.localStorage[difficulty]) {
				msg = "Your best time for "+ difficulty +" is "+ prettyTime(window.localStorage[difficulty]);
			} else {
				msg = "You haven't beat the "+ difficulty +" grid yet!";
			}
		} else {
			msg = "Try to solve it as fast as you can!"
		}
		$("#timer span.best-time").html( msg );
	}

	function saveScore() {
		// Local Storage Best Times
		if (window.localStorage[difficulty]) {
			if (window.localStorage[difficulty] > elaspedTime) {
				window.localStorage.setItem(difficulty, elaspedTime);
			}
		} else {
			window.localStorage.setItem(difficulty, elaspedTime);
		}
	}

	// Public
	return {
		// Variables
		difficulties: difficulties,
		difficulty: difficulty,

		// Methods
		setMode: function(diff) {
			$("#wrapper").removeClass(difficulty);
			difficulty = diff;
			switch (diff) {
				case 'Easy':
					rows = columns = 4;
					scrambleAmount = 10;
				break;
				case 'Normal':
					rows = columns = 5;
					scrambleAmount = 60;
				break;
				case 'Hard':
					rows = columns = 6;
					scrambleAmount = 100;
				break;
			}
			$(".button.selected").removeClass("selected");
			$(".button."+diff).addClass("selected");
			$("#wrapper").addClass(difficulty);
			lights = [];
			buildLights();
			stopTimer();
			resetTimer();
			scrambleLights();
			setMessage();
		},

		reset: function() {
			LightGrid.setMode(difficulty);
		}
	}

})();

window.onload = function () {
	LightGrid.setMode(LightGrid.difficulties[0]);
}