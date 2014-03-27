var JaradApp = function(){
	var slider;
	var currentJarad = 0;
	var jarads = [];

	function resizeSlider() {
		var slide = slider.getCurrentSlide();
		slider.reloadShow();
		slider.goToSlide(slide);
	}

	function swapJarads() {
		$(jarads[currentJarad]).toggleClass('active');
		currentJarad = (currentJarad+1)%jarads.length;
		$(jarads[currentJarad]).toggleClass('active');
	}

	function init() {
		slider = $('#projects').bxSlider({
			controls: false,
			pager: true,
			pagerType: "full"
		});

		$('#little-jarads').children('img').each(function () {
			jarads.push(this);
		});

		setInterval(swapJarads, 6000);

		// debounce resizing listener for performance
		$(window).resize($.debounce(500, resizeSlider));
	}

	// Probably didn't need to module this but wth, why not.
	return {
		init: init
	};
}();