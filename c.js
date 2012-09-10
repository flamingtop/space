window.c = (function(console){
    
    var consoleFunctions = {};
    
    $.each(
	
	[
	    'log', 'debug', 'info', 'warn', 'error', 
	    'assert', 'alert', 'dir', 'dirxml', 'trace', 
	    'group', 'groupCollapsed', 'groupEnd', 'time', 'timeEnd', 
	    'profile', 'profileEnd', 'count'
	],
	
	function(i, methodName) {
	    
	    var consoleFuncAvailable = (window.console && console[methodName]);
	    var mockDummyConsole = !consoleFuncAvailable;
	    
	    if(mockDummyConsole) {
		// dummy console functions
		consoleFunctions[methodName] = function(){ return false; };
	    } else {
		consoleFunctions[methodName] = function() {
		    if($.browser.msie) {
			
			/**** Fix IE's console object ****/
			
			// Why?
			// @see http://stackoverflow.com/questions/5538972/console-log-apply-not-working-in-ie9
			// @see http://patik.com/blog/complete-cross-browser-console-log/
			// @see http://patik.com/demos/consolelog/consolelog.js for even more browser support
			if (Function.prototype.bind && console && typeof console[methodName] == "object") {
			    // IE9
			    return (Function.prototype.bind.call(console[methodName], console)).apply(console, arguments);
			}
			else if (!Function.prototype.bind && typeof console != 'undefined' && typeof console[methodName] == 'object') {
			    // IE8
			    return Function.prototype.call.call(console[methodName], console, Array.prototype.slice.call(arguments));
			}
			else {
			    // don't care about the lower versions IEs
			    return false;
			}
		    }
		    else {
			return console[methodName].apply(console, arguments);
		    }
		};
	    }
	    
	});
    
    return consoleFunctions;
    
})(window.console);
