var JaradApp = function(){
	var ROTATE_INTERVAL = 6000;
	var slider;
	var rotateTimer;
	var currentCharacter = 0;
	var characters = [];

	function characterClicked() {
		swapCharacters();
		if (rotateTimer) {
			clearInterval(rotateTimer);
			startCharacterRotation();
		}
	}

	function startCharacterRotation() {
		rotateTimer = setInterval(swapCharacters, ROTATE_INTERVAL);
	}

	function swapCharacters() {
		$(characters[currentCharacter]).toggleClass('active');
		currentCharacter = (currentCharacter+1)%characters.length;
		$(characters[currentCharacter]).toggleClass('active');
	}

	function init() {
		var characterWrapper = $('#little-jarads');
		characterWrapper.children('img').each(function(){
			characters.push(this);
		});
		
		characterWrapper.click(characterClicked);
		startCharacterRotation();
	}

	// Probably didn't need to module this but wth, why not.
	return {
		init: init
	};
}();
