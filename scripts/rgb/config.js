// Configuration file used by most RGB scripts
// Also contains configuration for the emulator

window.config = {
	// Debug settings (can be overridden with specific hashes in the URL)
	debug:	{
		enabled:		false,	// Enable debug features (overriden to be true if #debug exists in the URL)
		remote: 		false, 	// Use Spotneedle?
		rpsCount: 		false, 	// Show how many iterations of the main emulator loop take place per second (overriden to be true if #rps exists in the URL)
		saveCount: 		true }, // Show how many saves have taken place via autosave
	
	// Emulator display settings
	screen: {
		selector:			'#screen',
		scaling:			'fit', 		// What scaling method to use for the screen. Currently, the only option is fit - make the screen as large as possible in the browser window, without stretching.
		smoothing:			false,		// settings[13]
		gbColored:			true,		// settings[4]
		nativeWidth:		160, 		// Width of a real GBC screen, pixels
		nativeHeight:		144, 		// Height of a real GBC screen, pixels
		tryScrollToZero: 	true, 		// Try to hide URL bar via scrollTo(0,0)
		useExpander: 		false, 		// The expander to scroll past the URL bar is causing issues with the layout, so it's disabled for now.
		expanderIdSelector:	'hideAddressBar' },		// ID of the element that is expanded so that the address bar can be hidden via scrollTo
	
	// Emulator audio settings
	// NOT CURRENTLY IMPLEMENTED
	audio:	{
		enabled: 			true, 	// Currently unused
		volume:				1 },	// settings[8]
	
	// Touch-based controls settings
	controls: {
		enabled:			true,
		leftSideSelector:	'#arrows',
		rightSideSelector:	'#buttons',
		bothSideSelector:	'.controls', 	// Selector for both elements of the controller
		minimumBottomPad:	2, 				// For sizing, the minimum distance between controller elements and the bottom of the screen in portrait orientation
		clickMaskSelector:	'.clickmask', 	// Clickmasks are the invisible SVG elements that register touch events. Each one should be selected by this selector.
		glideKeycode: 		'glide',

		bindings: {
			glide: 		['#arrows', '#touch-glide'],

			up:			['#arrows', '#touch-up'],
			down:		['#arrows', '#touch-down'],
			left:		['#arrows', '#touch-left'],
			right:		['#arrows', '#touch-right'],
	
			up_right:	['#arrows', '#touch-up-right'],
			up_left:	['#arrows', '#touch-up-left'],
			down_right:	['#arrows', '#touch-down-right'],
			down_left:	['#arrows', '#touch-down-left'],
	
			a:			['#buttons', '#touch-a'],
			b:			['#buttons', '#touch-b'],
			select:		['#buttons', '#touch-select'],
			start:		['#buttons', '#touch-start'] }},
	
	// Emulator settings
	core:	{
		loopInterval:				4,		// settings[6]
		bootROMFirst:				true,	// settings[1]
		useGBBootROM:				false,	// settings[11]
		gbModePriority:				false,	// settings[2]
		compatibilityFix:			false,	// settings[9]
		overrideMBCRAMLock:			false,	// settings[10]
		sramAutosave:				true },	// Autosave implemented for mobile device use

	// How should we present ourself to the user?
	behavior: 	{
		pauseOnBlur: 	true, 			// Pause the game when the window no longer has focus.
		newWindowLinks: true, 			// Open all links in a new window?
		webAppCapable: 	true }, 		// Do we want to let them put this on their homescreen?

	// Dropbox-specific selectors and settings
	dropbox: {
		connectButtonSelector: 			'#connectButton',
		connectButtonEventSelector: 	'#connectButton',
		romChooserSelector: 			'#loadGame',
		romListSelector: 				'#gameList',
		spinnerSelector: 				'#loading',
		splashSelector: 				'#front'
	},

	// For choosing a section of the UI
	modals: {
		current: 	'#loading',
		container: 	'#front',

		// References to classes used for animation
		classes: {
			noTransition: 	'noTransition', 	// Disables all CSS transitions on an element temporarily
			show: 			'show', 			// Show an element (via visibility:visible) that's already in the render tree, but isn't visible
			render: 		'render' }, 		// Add this element to the render tree (via display:block)

		// The section of the UI, and the triggers that activate it (when tapped)
		triggers: {
			about: 		'#mmAbout',
			mainMenu: 	'#aboutClose',
			loadGame: 	'#mmLoadGame'},

		// The section of the UI, and all of the elements that should be shown when it is active
		selectors: {
			mainMenu: 	'#mainMenu, #mainMenuHint',
			loadGame: 	'#loadGame, #loadGameHint',
			about: 		'#about, #aboutHint',
			spinner: 	'#loading',
			connect: 	'#connectButton' },

		// Special settings for the menu button
		menu: {
			buttonSelector: 			'#menuButton',
			svgSelector: 				'#menuButton object',
			activeClass: 				'active',
			svgFilledElementSelector: 	'path',
			activeFill: 				'#000000',
			inactiveFill: 				'#EEEEEE',
			modalName: 					'mainMenu' }
	}
};