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


// Animates an element in from display:none
rgbMode.prototype.enter = function (selector) {
	var elements = $(selector);

	elements.show();
	elements.each(function(){this.offsetHeight});		// Seems useless, right? Nope. It forces the elements to be rendered before the transition takes place. Without this, the element would just appear without any transition.
	elements.addClass(this.classes.show);
}

// Animates an element out and sets display to none after the transition
rgbMode.prototype.leave = function (selector) {
	var elements = $(selector),
		classes = this.classes;

	this.lastOut = selector;

	elements.each(function () {
		$(this).removeClass(classes.show).addClass(classes.animating);
		if ($(this).is(':visible') && ($(this).css('transition-duration') !=='0s')) {
			$(this).on('transitionend', (function (that, classesClosure) {
				return function () {
					$(that).find("." + classesClosure.animating).trigger('transitionend');
					$(that).hide().removeClass(classesClosure.animating).off('transitionend');
				};
			})(this, classes));
		} else {
			$(this).hide().removeClass(classes.animating);
		}
	});
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
	if (this.lastOut == '') return false;
	if ($(this.lastOut).hasClass(this.classes.animating)) return true;
	return false;
}

// Swaps the currently displayed modal
rgbMode.prototype.choose = function (newModal, retryUntilSuccessful) {
	if ((newModal !== this.current) && !this.currentlyChanging()) {
		if (newModal === this.selectors[this.menu.modalName]) {
			this.setMenuButtonAppearance(true);
		} else if (this.current === this.selectors[this.menu.modalName]) {
			this.setMenuButtonAppearance(false);
		}

		if ($(newModal).is(this.menu.noShowFor)) {
			this.leave(this.menu.buttonSelector);
		} else if (!$(this.menu.buttonSelector).is(':visible')) {
			this.enter(this.menu.buttonSelector);
		}

		this.enter(newModal);
		this.leave(this.current);
		this.current = newModal;
	}
}