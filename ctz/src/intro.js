;(function(ctz) {

	if (typeof define === 'function' && define.amd) {

		// support AMD
		define("ctz", [], function() {
			return ctz;
		});
	} else {

		window.ctz = ctz;
	}

})(function(window, $, undefined) {

		if (window.ctz) {
			return;
		}

		var ctz = {

			version		: '0.0.1',
			author 		: 'zoucaitou',
			email  		: 'zoucaitou@outlook.com',
			description : 'Just to prove that their'
		};