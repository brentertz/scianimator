# SciAnimator - Scientific Image Animator Plugin for jQuery #
[http://github.com/brentertz/scianimator](http://github.com/brentertz/scianimator)

Version: 0.9, Last updated: 12/19/2010

SciAnimator provides a simple yet powerful interface for animating a series of images.

## Features ##
* Easy customization - change labels, display only the controls you want or none at all, change control order
* Themeable via CSS - comes with 3 different themes, but you can also create your own
* Easily override default settings
* Multiple instances per page
* Optional console debug output

## Demo ##

I'll post a live demo before long, but for now please download the project and open the working example.

## Examples ##
These examples illustrate a few ways in which this plugin can be used.  

### Simplest possible creation: ###

Select the element which will hold the animator. (Perhaps a `<div id="scianimator"></div>` that you have already inserted into your page?) Pass an array of images in the options object.

	$('#scianimator').scianimator({  
		'images': ['images/foo.png', 'images/bar.png', 'images/bas.png', 'images/bat.png'],  
	});

### Create and start playing instantly: ###

	$('#scianimator').scianimator({  
		'images': ['images/foo.png', 'images/bar.png', 'images/bas.png', 'images/bat.png'],  
	}).scianimator('play');

### Create with additional options: ###

	$('#scianimator').scianimator({  
		'images': ['images/foo.png', 'images/bar.png', 'images/bas.png', 'images/bat.png'],  
		'height': 600,  
		'width': 600,  
		'theme': 'dark',  
		'defaultFrame': 'last'
	});  

### Override a default value for ALL instances: ###

	$.fn.scianimator.defaults.debug = true; // turn on debug logging  
	$.fn.scianimator.defaults.theme = 'blue'; // change default theme  

	$.fn.scianimator.defaults.utf8 = 'false'; // Use text labels rather than UTF8 symbols  
	$.fn.scianimator.defaults.labels.play = 'Juego'; // l10n/i18n
	
	// then create your instances and they will use your custom defaults...

### Call a public method from your own script: ###

	$('#scianimator').scianimator('play');  
	$('#scianimator').scianimator('showStatus', {status:'Hello Ladies...', timeout:3000});  

## Settings/Options ##
What settings/options are available? I'll document these more soon, but for now, please see 

`$.fn.scianimator.defaults` in [http://github.com/brentertz/scianimator/assets/js/jquery.scianimator.js](jquery.scianimator.js).

## Dependencies ##
SciAnimator relies on the 3rd party 'ExplorerCanvas' script to provide HTML5 canvas element support to Internet Explorer.  

Please see [http://code.google.com/p/explorercanvas/](http://code.google.com/p/explorercanvas/) for more information.

## Support and Testing ##
Information about what version or versions of jQuery this plugin has been tested with, what browsers it has been tested in, etc.

### jQuery Versions ###
* 1.4.4
* 1.4.2

### Browsers Tested ###
If your desired browser/version is not listed, it does not necessarily mean that it does not work, but rather that it hasn't yet been tested.

* Internet Explorer 6-9
* Firefox 3-4 (FF2 needs a little CSS love, but functionally it appears ok)
* Chrome 6,8
* Safari 4,5

## Known Issues ##
* IE6 control text color not being picked up properly.  Conflicts with a:hover color.
* IE7 did not respond to `<ctrl>`+click to disable frames, but I was testing on a VM.  Can anyone verify this behavior?	

## TODO Items ##
Aside from resolving the KNOWN ISSUES, the following items are in consideration for future updates.  Feel free to recommend any of these or make additional suggestions.

* Use more appropriate UTF-8 symbols for browsers that support them. (non-IE)
* Increase font size and decrease padding for elements using UTF8 icons
* Support for `<br />` element or new line in controls list
* Enable/disable controls as needed in UI - eg) max speed reached, disable +
* Instrument with more status messages - eg) The image for frame 10 failed to load.  Reloading images.
* Show failed images with alternate color
* Dwell multiplier controls
* Cache busting? Probably needed as option - in case pointing at images that get updated on intervals - also perhaps occasional force refresh - interval option?
* Ability to inject a new set if images, without needing to create a new instance.
* Image vs. Canvas option
* Keyboard controls - first, previous, play/stop, next, last
* Expose other methods/settings for override?
* Refactor controls method into smaller pieces

## Release History ##
* 0.9	- (12/19/2010) Initial checkin. This is a pre-release.  I want to complete a couple more of the TODO items before initial completion.

## License ##
Copyright (c) 2010 Brent Ertz  
Released under the MIT license.   
[http://github.com/brentertz/scianimator](http://github.com/brentertz/scianimator)