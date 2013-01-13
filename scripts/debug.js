// Utilities to make debugging. This file should be ignored in production.

(function () {
	var debug = window.debug;
	window.debug = null;
	
	var isMobile = {
		Android: function () { return navigator.userAgent.match(/Android/i); },
		BlackBerry: function () { return navigator.userAgent.match(/BlackBerry/i); },
		iOS: function () { return navigator.userAgent.match(/iPhone|iPad|iPod/i); },
		Opera: function () { return navigator.userAgent.match(/Opera Mini/i); },
		Windows: function () { return navigator.userAgent.match(/IEMobile/i); },
		any: function () { return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows()); }};
	
	window.log = function(){
		(log.history) ? log.history.push(arguments) : arguments;
		if (this.console) console.log(Array.prototype.slice.call(arguments)); };
	
	if (debug.firebug) {
		window.firebugHandle = {
			enable:	function () {
				window.location.href = "javascript:(function(F,i,r,e,b,u,g,L,I,T,E){if(F.getElementById(b))return;E=F[i+'NS']&&F.documentElement.namespaceURI;E=E?F[i+'NS'](E,'script'):F[i]('script');E[r]('id',b);E[r]('src',I+g+T);E[r](b,u);(F[e]('head')[0]||F[e]('body')[0]).appendChild(E);E=new%20Image;E[r]('src',I+L);})(document,'createElement','setAttribute','getElementsByTagName','FirebugLite','4','firebug-lite.js','releases/lite/latest/skin/xp/sprite.png','https://getfirebug.com/','#startOpened');";},
			show:	function () {
				Firebug.chrome.open(); },
			hide:	function () {
				Firebug.chrome.close(); }};
	}
	
	if (debug.remote) {
		$.getScript('https://www.spotneedle.com/observed/9a9f1b4b-d6ac-43e1-8d1c-f98905fb6adb'); } //SPOTNEEDLE IS THE SHIT
	
	/*document.body.appendChild($('<div id="rps" style="position:absolute;bottom:0;right:0;color:#0FF;"></div>')[0]);
	
	window.RPSlast = Date.now();
	window.RPSsmooth = new Array(512);
	
	GameBoyCore.prototype.run = (function (originalFn) {
		var now = Date.now();
		window.RPSsmooth.push(now - RPSlast);
		window.RPSsmooth.shift();
		document.getElementById('rps').innerHTML = 1000 / (window.RPSsmooth.reduce(function(a, b) { return a + b }) / 512) | 0;
		window.RPSlast = now;
		
		return function () {
			GameBoyCore.prototype.run.apply(originalFn, arguments); // call the original function
		};
	})(GameBoyCore.prototype.run);*/
})();