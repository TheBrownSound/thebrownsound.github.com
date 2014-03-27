var JaradApp = function(){
	var slider;

	function resizeSlider() {
		var slide = slider.getCurrentSlide();
		slider.reloadShow();
		slider.goToSlide(slide);
	};
	
	// Probably didn't need to module this but wth, why not.
	return {
		init: function() {
			slider = $('#projects').bxSlider({
				controls: false,
				pager: true,
				pagerType: "full"
			});
			
			// debounce resizing listener for performance
			$(window).resize($.debounce(500, resizeSlider));
		}
	}
}();