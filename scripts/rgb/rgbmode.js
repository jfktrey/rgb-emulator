"use strict";

// Wrappers for the modal UI
function rgbMode (modalConfig) {
	this.menu = modalConfig.menu;
	this.classes = modalConfig.classes;
	this.current = modalConfig.current;
	this.selectors = modalConfig.selectors;
	this.lastOut = '';

	$(this.menu.buttonSelector).on('tap', (function(rgbModeReference){
		return function(){ rgbModeReference.menuButton() }
	})(this));
	
	for (var mode in modalConfig.triggers) {
		$(modalConfig.triggers[mode]).on('tap', (function(rgbModeReference, modeToSelect){
			return function(){ rgbModeReference.choose(rgbModeReference.selectors[modeToSelect]) }
		})(this, mode));
	}
}


// Animates an element in.
// If animation is true, element enters using transition
// If animation is false, element appears immediately
// If animation is a string, that is used as a class to add to the element to animate it in.
rgbMode.prototype.in = function (selector, animation) {
	var elements = $(selector);

	elements.addClass(this.classes.render);
	if (animation !== false) elements.each(function(){this.offsetHeight});		// Seems useless, right? Nope. It forces the elements to be rendered before the transition takes place. Without this, the element would just appear without any transition.
	
	if (typeof(animation) == 'string') {
		elements.addClass(this.classes.noTransition);
		elements.addClass(animation);
	} else {
		if (animation === false) elements.addClass(this.classes.noTransition);
		elements.addClass(this.classes.show);
		elements.removeClass(this.classes.noTransition);
	}
}


// Animates an element out and sets display to none after the animation (or transition)
// If animation is true, element enters using transition
// If animation is false, element appears immediately
// If animation is a string, that is used as a class to add to the element to animate it in.
rgbMode.prototype.out = function (selector, animation) {
	var transitionDuration, animationDuration, timeoutWait, elements = $(selector);
	this.lastOut = selector;

	if (typeof(animation) == 'string') {
		elements.addClass(this.classes.noTransition);
		elements.addClass(animation);

		elements.on('animationend', (function(classes){
			return function(e){
				$(this).removeClass(classes.render).removeClass(classes.noTransition).off('animationend');
			};
		})(this.classes));
	} else {
		if (animation === false) elements.addClass(this.classes.noTransition);
		elements.removeClass(this.classes.show);

		if (animation) {
			elements.on('transitionend msTransitionEnd webkitTransitionEnd', (function(classes, randID){
				return function(e){
					$(this).removeClass(classes.render).removeClass(classes.noTransition).off('transitionend msTransitionEnd webkitTransitionEnd');
				};
			})(this.classes));

			elements.each((function (_this) { return function () {
				if ($(this).css('transition-duration') === '0s') {
					$(this).removeClass(_this.classes.render); 			// Remove elements without transitions from the render tree
				}
			}})(this));
		} else {
			elements.removeClass(this.classes.render);
			elements.removeClass(this.classes.noTransition);
		}
	}
}

// Handles the logic for when the menu button is pressed
// If the menu button is pressed then pressed again, it should return to the previous mode
rgbMode.prototype.menuButton = function () {
	if (this.current === this.selectors[this.menu.modalName]) {
		this.choose(this.menu.previousModal);
	} else {
		this.menu.previousModal = this.current;
		this.choose(this.selectors[this.menu.modalName]);
	}
}

// Sets styles to show that menu button has been depressed and that the menu is now active
rgbMode.prototype.setMenuButtonAppearance = function (makeActive) {
	if (makeActive) {
		$(this.menu.buttonSelector).addClass(this.menu.activeClass);
		$(this.menu.svgFilledElementSelector, $(this.menu.svgSelector).documents()[0]).css('fill', this.menu.activeFill);
	} else {
		$(this.menu.buttonSelector).removeClass(this.menu.activeClass);
		$(this.menu.svgFilledElementSelector, $(this.menu.svgSelector).documents()[0]).css('fill', this.menu.inactiveFill);
	}
}

// Checks to see whether any elements that are changing have unresolved class changes
rgbMode.prototype.currentlyChanging = function () {
	if ($(this.lastOut).hasClass(this.classes.render)) return true;
	return false;
}

// Swaps the currently displayed modal
rgbMode.prototype.choose = function (newModal) {
	if ((newModal !== this.current) && (!this.currentlyChanging())) {
		if (newModal === this.selectors[this.menu.modalName]) this.setMenuButtonAppearance(true);
		if (this.current === this.selectors[this.menu.modalName]) this.setMenuButtonAppearance(false);
		this.in(newModal, true);
		this.out(this.current, true);
		this.current = newModal;
	}
}