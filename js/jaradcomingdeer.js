var JaradApp = function(){
	var slider;

	function resizeSlider() {
		var slide = slider.getCurrentSlide();
		//slider.reloadShow();
		slider.goToSlide(slide);
	};
	
	// Probably didn't need to module this but wth, why not.
	return {
		init: function() {
			slider = $('#projects').bxSlider({
				//controls: false,
				infiniteLoop: true
			  	//pagerType: "short"
			});
			
			$('#projects-wrap a.button.previous').click(function(){
			  	slider.goToPreviousSlide();
			  	return false;
			});
			
			$('#projects-wrap a.button.next').click(function(){
			  	slider.goToNextSlide();
			  	return false;
			});
			
			// debounce resizing listener for performance
			$(window).resize($.debounce(500, resizeSlider));
		}
	}
}();