/* MorphSVG helper: uses MorphSVGPlugin when available, otherwise falls back to GSAP attr path tweening. */
(function(window) {
	'use strict';

	function clone(obj) {
		var next = {};
		if (!obj) return next;
		for (var key in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				next[key] = obj[key];
			}
		}
		return next;
	}

	function tweenVars(pathData, options) {
		var vars = clone(options);
		if (window.MorphSVGPlugin) {
			vars.morphSVG = pathData;
			return vars;
		}
		var attrs = clone(vars.attr);
		attrs.d = pathData;
		vars.attr = attrs;
		return vars;
	}

	window.MorphSVG = {
		tweenVars: tweenVars,
		hasPlugin: function() {
			return !!window.MorphSVGPlugin;
		}
	};
})(window);
