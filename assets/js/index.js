(function($) {
	Index = {
		// Visible images
		images_vis: [
			"assets/images/vis/20101208_1715_US_vis.jpg",
			"assets/images/vis/20101208_1730_US_vis.jpg",
			"assets/images/vis/20101208_1745_US_vis.jpg",
			"assets/images/vis/20101208_1800_US_vis.jpg",
			"assets/images/vis/20101208_1815_US_vis.jpg",
			"assets/images/vis/20101208_1845_US_vis.jpg",
			"assets/images/vis/20101208_1900_US_vis.jpg",
			"assets/images/vis/20101208_1915_US_vis.jpg",
			"assets/images/vis/20101208_1930_US_vis.jpg",
			"assets/images/vis/20101208_1945_US_vis.jpg",
			"assets/images/vis/20101208_2000_US_vis.jpg",
			"assets/images/vis/20101208_2015_US_vis.jpg",
			"assets/images/vis/20101208_2030_US_vis.jpg"
		],
		
		// Infrared images
		images_ir: [
			"assets/images/ir/20101209_1130_US_ir.jpg",
			"assets/images/ir/20101209_1145_US_ir.jpg",
			"assets/images/ir/20101209_1200_US_ir.jpg",
			"assets/images/ir/20101209_1215_US_ir.jpg",
			"assets/images/ir/20101209_1230_US_ir.jpg",
			"assets/images/ir/20101209_1245_US_ir.jpg",
			"assets/images/ir/20101209_1300_US_ir.jpg",
			"assets/images/ir/20101209_1315_US_ir.jpg",
			"assets/images/ir/20101209_1330_US_ir.jpg",
			"assets/images/ir/20101209_1345_US_ir.jpg",
			"assets/images/ir/20101209_1400_US_ir.jpg",
			"assets/images/ir/20101209_1415_US_ir.jp", // Purposefully invalid to demonstrate how a failed image loads
			"assets/images/ir/20101209_1430_US_ir.jpg"
		],
	
		/**
		 * Initialize the page
		 */
		init: function() 
		{
			//$.fn.scianimator.defaults.debug = true;
			//$.fn.scianimator.defaults.theme = 'blue';

			// Construct 1st animator
			$('#scianimator1').scianimator({
				'images': Index.images_vis,
				'width': '640',
				'utf8': false
			});
			
			// Construct 2nd animator
			$('#scianimator2').scianimator({
				'images': Index.images_ir,
				'width': 640,
				'theme': 'dark'
			});
		}
	};
	
	$(document).ready(Index.init);
})(jQuery);
