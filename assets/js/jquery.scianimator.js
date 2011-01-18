/**
 * SciAnimator - Scientific Image Animator Plugin for jQuery
 *
 * Copyright (c) 2010 Brent Ertz
 * Released under the MIT license.
 * http://github.com/brentertz/scianimator
*/
(function($) {
	var CONSTANTS = {
		CONTROLS_ALL: 'all',
		CONTROLS_NONE: 'none',
		DIRECTION_FORWARD: 0,
		DIRECTION_REVERSE: 1,
		LOOP_MODE_NONE: 'none',
		LOOP_MODE_LOOP: 'loop',
		LOOP_MODE_SWEEP: 'sweep',
		PLAY_MODE_STOPPED: 0,
		PLAY_MODE_PLAYING: 1,
		POSITION_TOP: 0,
		POSITION_BOTTOM: 1
	};
		
	/**
	 * Controller/Main method
	 */
	$.fn.scianimator = function(method) {
		if (methods[method])
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		else if (typeof method === 'object' || !method)
			return methods.init.apply(this, arguments);
		else
			$.error('Method ' +  method + ' does not exist on jQuery.scianimator');
	};		
		
	/**
	 * Default settings
	 * Defaults may be overridden at a global level by setting any of these properties directly prior to instantiation. eg) $.fn.scianimator.defaults.debug = true;
	 * Defaults may be overridden on an instance specific basis by passing an options object to constructor.  Any changes will be merged in.
	 */
	$.fn.scianimator.defaults = {
		'autoRefresh': false, // false to disable, otherwise milliseconds between auto refreshes
		'keyboard': true, // Enable keyboard controls? All instances on page respond to keyboard events.
		'debug': false, // Write debug info to console?
		'images': [],
		'controlContainer': null, // Optional, container where should controls be placed. eg) $('#myDiv')
		'controlPosition': CONSTANTS.POSITION_BOTTOM, // Optional. top or bottom
		'controls': CONSTANTS.CONTROLS_ALL, // Which controls should be displayed.  ALL, NONE or an array ['first', 'previous', 'play', 'next', 'last', 'navigator', 'loop', 'speed'] - orderable. 		
		'defaultFrame': 0, // The default frame to display - number [0-9] or keywords 'first' or 'last'
		'delay': 250, // Controls animation speed - milliseconds between frames
		'delayStep': 50, // milliseconds
		'delayMin': 25, // Minimum delay - milliseconds
		'delayMax': 5000, // Maximum delay - milliseconds
		'dwellMultiplier': 2, // Used to autocalculate the length of the dwell (pause on first/last frames) ~N*delay
		'theme': 'light', // Can be any of the predefined CSS themes - light (default), dark, blue - or use null or '' for base styles only
		'width': null, // Optional - set width on container
		'utf8': true, // Use UTF-8 labels where possible? eg) for symbols
		'loopMode': CONSTANTS.LOOP_MODE_LOOP, // loop, sweep, none		
		'labels': { // Labels used in UI controls
			'text': {
				'first':'First', 
				'previous':'Previous', 
				'play':'Play', 
				'stop':'Stop', 
				'next':'Next', 
				'last':'Last',
				'loop': {
					'tip':'Click to toggle loop mode',
					'loop':'Loop',
					'sweep':'Sweep',
					'none':'None'					
				},
				'speed': {
					'speed':'Speed',
					'down':'-',
					'up':'+'					
				},
				'navigator': {
					'tip': 'Click to go to frame; &lt;ctrl&gt;+click to enable/disable frame.'
				},
				'status': {
					'preload': 'Preloading images...',
					'refresh': 'Refreshing images from source...'
				}
			},
			'utf8': { 
				'first':'|&#8592;', //&#8676;
				'previous':'&#8592;', 
				'play':'&#9658;', //'&#9656;', 
				'stop':'&#9632;', //'&#9642;', 
				'next':'&#8594;', 
				'last':'&#8594;|' //&#8677;
			}
		}		
	};
	var settings = {};
	
	var methods = {
		/**
		 * Initialize
		 */
		init: function(options) {
			settings = $.extend(true, {}, $.fn.scianimator.defaults, options);
		
			debug('init');			
			
			return this.each(function() {
				var $this = $(this);
				var data = $this.data('scianimator');

				// Initialize plugin
				$(this).data('scianimator', {
					id: $this[0].id,
					target: $this,
					image: null, // Primary image element
					animationTimer: null, // The timer used for animating the images
					autoRefreshTimer: null, // The timer used for handling image auto-refresh from source
					playMode: CONSTANTS.PLAY_MODE_STOPPED, // Play mode - Is the animation running?
					frames: [],
					currentFrame: settings.defaultFrame,
					firstFrame: 0,
					lastFrame: null,
					disabledFrames: [], // Contains frames that user has disabled
					direction: CONSTANTS.DIRECTION_FORWARD,
					dwell: 0, // calculated later
					settings: settings, // Instance specific copy of settings
					controls: {} // Instance specific ID references to controls
				});

				$this.scianimator('loadImages', 'preload') // Preload images
					.scianimator('container') // Initialize the container
					.scianimator('image') // Initialize the main image
					.scianimator('controls') // Initialize the controls
					.scianimator('calculateDwell'); // Initialize the dwell
			});
		},
			
		/**
		 * Destroy - Unbinds scianimator instance and removes it from page
		 */
		destroy: function() {
			debug('destroy');
			
			return this.each(function() {
				var $this = $(this);
				var data = $this.data('scianimator');
				
				$(window).unbind('.scianimator');
				$this.removeData('scianimator');
				
				window.clearTimeout(data.animationTimer);
				$this.remove();
			});
		},			
			
		/**
		 * Draw an image - updates the animation display
		 * @param frame - integer - frame number
		 */
		drawImage: function(frame) {
			debug('drawImage');
			
			var $this = $(this);
			var data = $this.data('scianimator');
			
			frame = parseInt(frame, 10);
			var image = data.frames[frame];
					
			$(data.image)
				.load(function() {
					debug('Loaded image for frame #'+frame+' : '+image.src);
				}).error(function() {
					debug('Image failed to load for frame #'+frame+' : '+image.src);
					$this.scianimator('enableDisable', {'frame':frame,'state':'disable'}); // Disable the frame for the image that failed	
				})
				.attr('src', image.src);
			
			return $this;
		},		
		
		/**
		 * Container
		 */
		container: function() {
			debug('container');
			
			var $this = $(this);
			var data = $this.data('scianimator');
			
			$this.addClass('scianimator');
			if (data.settings.theme !== undefined)
				$this.addClass(data.settings.theme);
			if (data.settings.width !== undefined)
				$this.css('width', data.settings.width);
			
			return $this;
		},
		
		/**
		 * Image - Initialize the primary image element used to display the current frame
		 */
		image: function() {
			debug('image');
			
			var $this = $(this);
			var data = $this.data('scianimator');
			
			var $img = $('<img />');
			$this.append($img[0]);
			data.image = $img[0];
			
			// Display the default frame
			if ('number' === typeof data.settings.defaultFrame)
				$this.scianimator('goto', data.settings.defaultFrame);
			else if ('last' === data.settings.defaultFrame)
				$this.scianimator('last');
			else
				$this.scianimator('first');
				
			return $this;
		},
			
		/**
		 * Controls
		 */
		controls: function() {
			debug('controls');
			
			var $this = $(this);
			var data = $this.data('scianimator');
			
			var controlsWrapper = $('<div id="'+data.id+'-controls" class="scianimator controls"></div>');
			if (data.settings.theme !== undefined)
				controlsWrapper.addClass(data.settings.theme);
				
			var form = $('<form></form>');
			var controls = { // Order is important here
				first: function(){
					var label = (data.settings.utf8) ? data.settings.labels.utf8.first : data.settings.labels.text.first;
					return $('<a id="'+data.id+'-first" class="control first" href="#">'+label+'</a>');
				},
				previous: function(){
					var label = (data.settings.utf8) ? data.settings.labels.utf8.previous : data.settings.labels.text.previous;
					return $('<a id="'+data.id+'-previous" class="control previous" href="#">'+label+'</a>');
				},
				play: function(){
					var label = (data.settings.utf8) ? data.settings.labels.utf8.play : data.settings.labels.text.play;
					return $('<a id="'+data.id+'-play" class="control play" href="#">'+label+'</a>'); 
				},
				next: function(){ 
					var label = (data.settings.utf8) ? data.settings.labels.utf8.next : data.settings.labels.text.next;
					return $('<a id="'+data.id+'-next" class="control next" href="#">'+label+'</a>');
				},
				last: function(){
					var label = (data.settings.utf8) ? data.settings.labels.utf8.last : data.settings.labels.text.last;
					return $('<a id="'+data.id+'-last" class="control last" href="#">'+label+'</a>');
				},
				navigator: function() {
					var html = $('<span id="'+data.id+'-navigator" class="control navigator box"></span>');
					var tip = data.settings.labels.text.navigator.tip;
					$.each(data.frames, function(index, value) {
						html.append('<a id="'+data.id+'-navigator-'+index+'" title="'+tip+'" href="#" class="control navigator">&nbsp;</a>');
					});
					return html;
				},
				loop: function(){ 
					var label = (data.settings.utf8 && data.settings.labels.utf8.loop !== undefined) ? data.settings.labels.utf8.loop[data.settings.loopMode] : data.settings.labels.text.loop[data.settings.loopMode];
					var tip = data.settings.labels.text.loop.tip;
					return $('<a id="'+data.id+'-loop" class="control loop '+data.settings.loopMode+'" title="'+tip+'" href="#">'+label+'</a>'); 
				},
				speed: function(){ 
					var label_speed = (data.settings.utf8 && data.settings.labels.utf8.speed !== undefined) ? data.settings.labels.utf8.speed.speed : data.settings.labels.text.speed.speed;
					var label_speed_up = (data.settings.utf8 && data.settings.labels.utf8.speed !== undefined) ? data.settings.labels.utf8.speed.up : data.settings.labels.text.speed.up;
					var label_speed_down = (data.settings.utf8 && data.settings.labels.utf8.speed !== undefined) ? data.settings.labels.utf8.speed.down : data.settings.labels.text.speed.down;
					return $('<span id="'+data.id+'-speed" class="control speed box"><a id="'+data.id+'-speed-down" class="control speed-down small" href="#">'+label_speed_down+'</a> <label>'+label_speed+'</label> <a id="'+data.id+'-speed-up" class="control speed-up small" href="#">'+label_speed_up+'</a></span>');
				}				
			};
					
			// Initialize control behaviors
			controlsWrapper.delegate('form', 'submit', function(event) {
				event.preventDefault();
			}).delegate('a', 'click', function(event) {
				event.preventDefault();
				switch (event.target.id) {
					case data.id+'-first':
						$this.scianimator('first');			
						break;
					case data.id+'-previous':
						$this.scianimator('previous');			
						break;
					case data.id+'-play':
						$this.scianimator('playOrStop');
						break;
					case data.id+'-next':
						$this.scianimator('next');			
						break;
					case data.id+'-last':
						$this.scianimator('last');			
						break;				
					case data.id+'-loop':
						$this.scianimator('loopMode');			
						break;
					case data.id+'-speed-down':
						$this.scianimator('speedDown');			
						break;
					case data.id+'-speed-up':
						$this.scianimator('speedUp');
						break;											
				}
			}).delegate('a.navigator', 'click', function(event) {
				event.preventDefault();
				// Check for and handle navigator links
				var navigatorId = data.id+'-navigator-';
				if ((event.target.id).indexOf(navigatorId) != -1) {
					var frame = parseInt((event.target.id).substring(navigatorId.length), 10); // Uses frame number at end of id
					if (event.metaKey) // Indicates that ctrl key is pressed
						$this.scianimator('enableDisable', {'frame':frame});
					else
						$this.scianimator('goto', frame);
				}
			});
			
			// Select and arrange controls
			if ($.isArray(data.settings.controls) && data.settings.controls.length > 0) {
				$.each(data.settings.controls, function(index, value) { // Controls must be appended in order specified by user
					form.append(controls[value]);
					data.controls[value] = controls[value]()[0].id;
				});
			}
			else if (CONSTANTS.CONTROLS_ALL === data.settings.controls) {
				$.each(controls, function(key, value){
					form.append(value);
					data.controls[key] = value()[0].id;
				});
			}
			else {
				debug('Display no controls');
			}			

			// Append form/container to DOM only if it contains controls
			if (!$(form).is(':empty')) {
				controlsWrapper.append(form);
				if (data.settings.controlContainer !== null) {  // Add controls to user-defined element
					if(CONSTANTS.POSITION_TOP === data.settings.controlPosition)
						$(data.settings.controlContainer).prepend(container); // Prepend controls to top
					else
						$(data.settings.controlContainer).append(container); // Append controls to bottom
				}
				else { // Add controls to primary container
					if(CONSTANTS.POSITION_TOP === data.settings.controlPosition)
						$this.prepend(controlsWrapper); // Prepend controls to top
					else
						$this.append(controlsWrapper); // Append controls to bottom
				}
			}
			
			// Enable keyboard controls?
			if (data.settings.keyboard === true)
				$this.scianimator('keyboard');
			
			// Callback method
			$this.scianimator('onControlsComplete');
			
			return $this;
		},
		
		/**
		 * Keyboard - enable keyboard controls
		 */
		keyboard: function() {
			debug('keyboard');
			
			var $this = $(this);
			var data = $this.data('scianimator');			
			
			$(document)
			//.unbind('keydown.scianimator.controls')
			.bind('keydown.scianimator.controls', function(event) {
				if (event.target.tagName != 'INPUT' && event.target.tagName != 'TEXTAREA')
				{
					switch (event.keyCode) 
					{
						case 13: // enter
						case 32: // space bar
							$this.scianimator('playOrStop');
							break;
						case 37: // left arrow
							if (event.shiftKey)
								$this.scianimator('first');
							else
								$this.scianimator('previous');
							break;
						case 39: // right arrow
							if (event.shiftKey)
								$this.scianimator('last');
							else
								$this.scianimator('next');
							break;							
					}
				}
			});			
		},
		
		/**
		 * onControlsComplete - Callback method for when controls have been initialized
		 */
		onControlsComplete: function() {
			debug('onControlsComplete');
			
			var $this = $(this);
			var data = $this.data('scianimator');

			$this.scianimator('hilightCurrent');
		},

		/**
		 * Play or Stop - Toggles the play/stop state
		 */
		playOrStop: function() {
			debug('playOrStop');
			
			var $this = $(this);
			var data = $this.data('scianimator');			
			
			if (CONSTANTS.PLAY_MODE_PLAYING === data.playMode)
				$this.scianimator('stop');		
			else if (CONSTANTS.PLAY_MODE_STOPPED === data.playMode)
				$this.scianimator('play');
			
			return $this;
		},		
		
		/**
		 * Play - Starts the animation
		 */
		play: function() {
			debug('play');
			
			var $this = $(this);
			var data = $this.data('scianimator');			
			
			data.playMode = CONSTANTS.PLAY_MODE_PLAYING;
			
			// Use delay or dwell?
			var delay = data.settings.delay;
			if (CONSTANTS.DIRECTION_FORWARD === data.direction) {
				if (data.currentFrame === data.firstFrame || data.currentFrame === data.lastFrame)
					delay = data.dwell;
			}
			debug('delay: ' + delay);
			
			data.animationTimer = self.setTimeout(function() { 
				$this.scianimator('animate');
			}, delay);
			
			// Change button state
			var label = (data.settings.utf8) ? data.settings.labels.utf8.stop : data.settings.labels.text.stop;
			$('#'+data.controls.play)
				.removeClass('play').addClass('stop')
				.html(label);
			
			return $this;
		},
			
		/**
		 * Stop - Stops the animation
		 */
		stop: function() {
			debug('stop');

			var $this = $(this);
			var data = $this.data('scianimator');			
			
			data.animationTimer = window.clearTimeout(data.animationTimer);
			data.playMode = CONSTANTS.PLAY_MODE_STOPPED;
			
			// Change button state
			var label = (data.settings.utf8) ? data.settings.labels.utf8.play : data.settings.labels.text.play;
			$('#'+data.controls.play)
				.removeClass('stop').addClass('play')
				.html(label);
			
			return $this;
		},
		
		/**
		 * Animate - Performs previous and next operations
		 */
		animate : function() {
			debug('animate');
			
			var $this = $(this);
			var data = $this.data('scianimator');			
			
			if (CONSTANTS.DIRECTION_FORWARD === data.direction)
				$this.scianimator('next');
			else if (CONSTANTS.DIRECTION_REVERSE === data.direction)
				$this.scianimator('previous');				
			
			if (CONSTANTS.PLAY_MODE_PLAYING === data.playMode)
				$this.scianimator('play');
			
			return $this;
		},
		
		/**
		 * Previous - Go to previous frame
		 */
		previous: function() {
			debug('previous');

			var $this = $(this);
			var data = $this.data('scianimator');
			
			data.currentFrame--;
			
			// Skip disabled frames
			if ($.inArray(data.currentFrame, data.disabledFrames) != -1) {
				$this.scianimator('previous');
				return $this;
			}			
			
			debug(data.firstFrame + ':' + data.currentFrame + ':' + data.lastFrame);
			
			if (data.currentFrame < data.firstFrame)
			{
				if (CONSTANTS.PLAY_MODE_PLAYING === data.playMode) {
					if (CONSTANTS.LOOP_MODE_LOOP === data.settings.loopMode) {
						$this.scianimator('last');
					}
					else if (CONSTANTS.LOOP_MODE_SWEEP === data.settings.loopMode) {
						data.direction = CONSTANTS.DIRECTION_FORWARD;
						$this.scianimator('next');
					}
					else if (CONSTANTS.LOOP_MODE_NONE === data.settings.loopMode) {
						$this.scianimator('stop');
					}					
				}
				else if (CONSTANTS.PLAY_MODE_STOPPED === data.playMode) {
					$this.scianimator('last'); // Always wrap when clicking previous/next
				}
			}
			else
			{
				$this.scianimator('goto', data.currentFrame);
			}
			
			return $this;
		},		
		
		/**
		 * Next - Go to next frame
		 */
		next: function() {
			debug('next');

			var $this = $(this);
			var data = $this.data('scianimator');
			
			data.currentFrame++;
			
			debug(data.firstFrame + ':' + data.currentFrame + ':' + data.lastFrame);
			
			// Skip disabled frames
			if ($.inArray(data.currentFrame, data.disabledFrames) != -1) {
				$this.scianimator('next');
				return $this;
			}
			
			if (data.currentFrame > data.lastFrame)
			{
				if (CONSTANTS.PLAY_MODE_PLAYING === data.playMode) {
					if (CONSTANTS.LOOP_MODE_LOOP === data.settings.loopMode) {
						$this.scianimator('first');
					}
					else if (CONSTANTS.LOOP_MODE_SWEEP === data.settings.loopMode) {
						data.direction = CONSTANTS.DIRECTION_REVERSE;
						$this.scianimator('previous');
					}
					else if (CONSTANTS.LOOP_MODE_NONE === data.settings.loopMode) {
						$this.scianimator('stop');
					}
				}
				else if (CONSTANTS.PLAY_MODE_STOPPED === data.playMode) {
					$this.scianimator('first'); // Always wrap when clicking previous/next
				}
			}
			else
			{
				$this.scianimator('goto', data.currentFrame);
			}
			
			return $this;
		},

		/**
		 * First - Go to first frame
		 */
		first: function() {
			debug('first');

			var $this = $(this);
			var data = $this.data('scianimator');
					
			$this.scianimator('goto', data.firstFrame);
			
			return $this;
		},
		
		/**
		 * Last - Go to last frame
		 */
		last: function() {
			debug('last');

			var $this = $(this);
			var data = $this.data('scianimator');
			
			$this.scianimator('goto', data.lastFrame);		
			
			return $this;
		},
		
		/**
		 * Goto - Go to a specific frame
		 * @frame - integer - frame number
		 */
		'goto': function(frame) {
			debug('goto');

			var $this = $(this);
			var data = $this.data('scianimator');
			
			var frame = parseInt(frame, 10);
			if (frame > data.lastFrame)
				frame = data.lastFrame;
			else if (frame < data.firstFrame)
				frame = data.firstFrame;
			
			debug(frame);

			data.currentFrame = frame;			
			$this.scianimator('drawImage', data.currentFrame);
			$this.scianimator('hilightCurrent');
			
			return $this;
		},		
		
		/**
		 * Loop Mode - toggles different loop modes
		 * @param event - optional
		 */
		loopMode: function() {
			debug('loop mode');
			
			var $this = $(this);
			var data = $this.data('scianimator');			
			
			var originalLoopMode = data.settings.loopMode;
			
			if (CONSTANTS.LOOP_MODE_NONE === data.settings.loopMode) {
				data.settings.loopMode = CONSTANTS.LOOP_MODE_LOOP;
			}
			else if (CONSTANTS.LOOP_MODE_LOOP === data.settings.loopMode) {
				data.settings.loopMode = CONSTANTS.LOOP_MODE_SWEEP;
			}
			else if (CONSTANTS.LOOP_MODE_SWEEP === data.settings.loopMode) {
				data.direction = CONSTANTS.DIRECTION_FORWARD; // Prevents getting stuck in reverse
				data.settings.loopMode = CONSTANTS.LOOP_MODE_NONE;
			}
					
			// Change button state
			var label = (data.settings.utf8 && data.settings.labels.utf8.loop !== undefined) ? data.settings.labels.utf8.loop[data.settings.loopMode] : data.settings.labels.text.loop[data.settings.loopMode];
			$('#'+data.controls.loop)
				.removeClass(originalLoopMode).addClass(data.settings.loopMode)
				.html(label);			
			
			debug(data.settings.loopMode);
			
			return $this;
		},
		
		/**
		 * Speed up - decreases delay
		 */
		speedUp: function() {
			debug('speed up');

			var $this = $(this);
			var data = $this.data('scianimator');
			
			data.settings.delay -= data.settings.delayStep;
			data.settings.delay = (data.settings.delay < data.settings.delayMin) ? data.settings.delayMin : data.settings.delay;
			
			$this.scianimator('calculateDwell');
			
			if (CONSTANTS.PLAY_MODE_PLAYING == data.playMode)
				$this.scianimator('stop').scianimator('play'); // Restart with new delay settings
			
			debug('Delay: ' + data.settings.delay);			
			
			return $this;
		},	
		
		/**
		 * Speed down - increase delay
		 */
		speedDown: function() {
			debug('speed down');

			var $this = $(this);
			var data = $this.data('scianimator');
			
			data.settings.delay = (data.settings.delay <= data.settings.delayMin) ? 0 : data.settings.delay;  
			data.settings.delay += data.settings.delayStep;
			data.settings.delay = (data.settings.delay > data.settings.delayMax) ? data.settings.delayMax : data.settings.delay; 
			
			$this.scianimator('calculateDwell');
			
			if (CONSTANTS.PLAY_MODE_PLAYING == data.playMode)
				$this.scianimator('stop').scianimator('play'); // Restart with new delay settings
			
			debug('delay: ' + data.settings.delay);
			
			return $this;
		},
		
		/**
		 * Calculate Dwell - Calculates the length of the pause on the first and last frames
		 */
		calculateDwell: function() {
			debug('calculateDwell');

			var $this = $(this);
			var data = $this.data('scianimator');
			
			var dwell = data.settings.delay * data.settings.dwellMultiplier;
			if (dwell < data.settings.delayMin)
				dwell = data.settings.delayMin;
			if (dwell > data.settings.delayMax)
				dwell = data.settings.delayMax;
			
			data.dwell = dwell;
			
			debug('dwell: '+ data.dwell);
			
			return $this;
		},		
		
		/**
		 * Enable/Disable - Enables or disables the specified frame
		 * @param frame - integer - the frame to enable/disable
		 * @param state - optional - 'enable' | 'disable' - can specify state to set, rather than the default toggle behavior
		 *     eg) $('#scianimator1').scianimator('enableDisable', {'frame':2,'state':'disable'});
		 */
		enableDisable: function(params) {
			debug('enableDisable');
			var state = params.state || 'toggle';
			
			var $this = $(this);
			var data = $this.data('scianimator');
			
			var frame = parseInt(params.frame, 10);
			var el = $('#'+data.controls.navigator+'-'+frame);
			var found = $.inArray(frame, data.disabledFrames); // Is currently disabled?
			
			switch (state) {
				case 'enable':
					if (found != -1) {
						debug('enable: ' + frame);
						data.disabledFrames.splice(found, 1);
						$(el).removeClass('disabled');
					}					
					break;
				case 'disable':
					if (found == -1) {
						debug('disable: ' + frame);
						data.disabledFrames.push(frame);
						$(el).addClass('disabled');
					}
					break;
				case 'toggle':
				default:
					if (found != -1) {
						debug('enable: ' + frame);
						data.disabledFrames.splice(found, 1);
						$(el).removeClass('disabled');
					}
					else {
						debug('disable: ' + frame);
						data.disabledFrames.push(frame);
						$(el).addClass('disabled');
					}														
			}
			
			debug('disabledFrames:' + data.disabledFrames);
			
			return $this;
		},
		
		/**
		 * Hilight current frame - Updates any frame indicators to properly highlight the current frame. eg) in the navigator element
		 */
		hilightCurrent: function() {
			debug('hilightCurrent');
			
			var $this = $(this);
			var data = $this.data('scianimator');

			var containerId = data.controls.navigator;
			var linkId = containerId+'-'+data.currentFrame;
			$('a', '#'+containerId).removeClass('current');
			$('#'+linkId, '#'+containerId).addClass('current');
		},
		
		/**
		 * Load images
		 * @param type - preload or refresh
		 */
		loadImages: function(type) {
			debug('loadImages');

			var $this = $(this);
			var data = $this.data('scianimator');

			if ('preload' === type)
				$this.scianimator('showStatus', {'status':data.settings.labels.text.status.preload});
			else if ('refresh' === type)
				$this.scianimator('showStatus', {'status':data.settings.labels.text.status.refresh});

			data.frames = [];
			var count = 0;
			$.each(data.settings.images, function(frame, src) {			
				var image = $('<img />')
					.load(function() {
						if (++count === data.settings.images.length)
						 	$this.scianimator('onLoadImagesComplete'); // Callback method
					}).error(function() {
						debug('Image failed to load for frame #'+frame+' : '+src);				
						$this.scianimator('enableDisable', {'frame':frame,'state':'disable'}); // Disable the frame for the image that failed
						
						if (++count === data.settings.images.length)
						 	$this.scianimator('onLoadImagesComplete'); // Callback method
					});
					
				if ('refresh' === type)
					image.attr('src', randomizeUrl(src)); // force refresh
				else
					image.attr('src', src);
					
				data.frames.push(image[0]); // Immediately push into frames so controls can build properly
		    });
			data.lastFrame = data.frames.length -1;
					
			return $this;
		},
		
		/**
		 * On Load Images Complete - Callback method for when images have been loaded
		 */
		onLoadImagesComplete: function() {
			debug('onLoadImagesComplete');			

			var $this = $(this);
			var data = $this.data('scianimator');

			// Start the autoRefresh timer - if necessary
			if (data.settings.autoRefresh !== false)
				data.autoRefreshTimer = self.setTimeout(function() { 
					$this.scianimator('refresh');
				}, parseInt(data.settings.autoRefresh, 10));

			$this.scianimator('hideStatus');
		},
		
		/**
		 * Refresh images from source, bypassing browser cache
		 */
		refresh: function() {
			debug('refresh');
			
			var $this = $(this);
			var data = $this.data('scianimator');
			
			$this.scianimator('loadImages', 'refresh');
		},
		
		/**
		 * Show status - Shows a status indicator
		 * @param params.status - Message to be displayed
		 * @param params.timeout - optional - time milliseconds after which the status will auto remove itself
		 * eg) $('#scianimator1').scianimator('showStatus', {status:'Hello Ladies...', timeout:3000});
		 */
		showStatus: function(params) {
			debug('showStatus');

			var $this = $(this);
			var data = $this.data('scianimator');

			$this.scianimator('hideStatus');
			
			var el = $('<div class="status">'+params.status+'</div>');
			el.hide().appendTo($this).fadeIn('slow');
			
			if (params.timeout !== undefined) {
				self.setTimeout(function(){ $this.scianimator('hideStatus'); }, parseInt(params.timeout, 10))
			}
			
			return $this;
		},
		
		/**
		 * Hide status - Hides the status indicator
		 */
		hideStatus: function() {
			debug('hideStatus');

			var $this = $(this);
			var data = $this.data('scianimator');
			
			$('.status', $this).fadeOut('slow', function() {
				$(this).remove();
			});
			
			return $this;
		},
		
		/**
		 * List Images - Lists all of the images used in the animation
		 * @return array
		 */
		listImages: function() {
			debug('list images');

			var $this = $(this);
			var data = $this.data('scianimator');

			return data.settings.images;
		}
	};

	/**
	 * Write to console - private utility method
	 */
	function debug(value) {
		if (settings.debug && window.console && window.console.log)
			window.console.log(value);
	}
	
	/**
	 * Appends a random number to a URL - private utility method
	 *    eg) rand=.012345677890
	 * Will replace existing 'rand' param if already exists.
	 * @param url - the url to be randomized
	 * @return the randomized url
	 */
	function randomizeUrl(url)
	{
		var root = url;
		var pos = url.indexOf('?');
		var qs = '';
		if (pos != -1) // found ?
		{
			root = url.substring(0,pos);
			qs = url.substring(pos);
			qs = qs.replace(/[(?|&)]rand=[^&]+/g,'');
		}

		url = root + ((qs.length) ? qs+'&' : qs+'?');
		url += 'rand=' + Math.random();
		return url;
	}
})(jQuery);