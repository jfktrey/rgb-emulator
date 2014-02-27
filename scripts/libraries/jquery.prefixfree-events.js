/*!
 * jQuery.prefixfree-events v0.2
 *
 * https://github.com/georgeadamson/jQuery.unprefixed-events
 *
 * Copyright (c) George Adamson @GeorgeAdamson
 * Available under the BSD and MIT licenses
 */

/*
 * Normalise vendor-specific TRANSITION and ANIMATION events (and potentially others too)
 * so that we can easily do things like jQuery('#myElement').on('transitionend'...)
 * without caring about which vendor prefix to use.
 * Under the hood, jQuery will bind to the appropriate vendor-prefixed event name.
 * Inspred by the transEndEventNames example at http://modernizr.com/docs/#prefixed
 *
 * Requires:    jQuery and Modernizr.js
 * Tested with: jQuery 1.8.3 and Modernizr 2.6.2
 */

;(function( $, Modernizr ){

  var eventCategories = {

    // Eg: Modernizr.prefixed('transition')
    transition: {

      transitionend: {
        'WebkitTransition' : 'webkitTransitionEnd',
        'MozTransition'    : 'transitionend',
        'OTransition'      : 'oTransitionEnd',
        'msTransition'     : 'MSTransitionEnd',
        'transition'       : 'transitionend'
      }

      // Just wishful thinking :)
      //transitionstart: {
      //  'WebkitTransition' : 'webkitTransitionStart',
      //  'MozTransition'    : 'transitionstart',
      //  'OTransition'      : 'oTransitionStart',
      //  'msTransition'     : 'MSTransitionStart',
      //  'transition'       : 'transitionstart'
      //}

    },

    animation: {

      animationstart: {
        'WebkitAnimation' : 'webkitAnimationStart',
        'MozAnimation'    : 'animationstart',
        'OAnimation'      : 'oAnimationStart',
        'msAnimation'     : 'MSAnimationStart',
        'animation'       : 'animationstart'
      },

      animationiteration: {
        'WebkitAnimation' : 'webkitAnimationIteration',
        'MozAnimation'    : 'animationiteration',
        'OAnimation'      : 'oAnimationIteration',
        'msAnimation'     : 'MSAnimationIteration',
        'animation'       : 'animationiteration'
      },
      
      animationend: {
        'WebkitAnimation' : 'webkitAnimationEnd',
        'MozAnimation'    : 'animationend',
        'OAnimation'      : 'oAnimationEnd',
        'msAnimation'     : 'MSAnimationEnd',
        'animation'       : 'animationend'
      }

    }

  }


  if( !$ || !Modernizr || !Modernizr.prefixed ) return


  $.each( eventCategories, function( eventCategory, eventsInCategory ){

    // Derive the vendor-prefixed name for the event category, eg: "transition" --> "WebkitTransition"
    // Only proceed if the browser supports this type of event:
    var prefixedEventCategory = Modernizr.prefixed(eventCategory)

    if( prefixedEventCategory )

      $.each( eventsInCategory, function( eventName, vendorLookup ){

        // Derive the vendor-prefixed name for the event, eg: "webkitAnimationEnd"
        var prefixedEventName   = vendorLookup[ prefixedEventCategory ],
            unprefixedEventName = vendorLookup[ eventCategory ]

        // Tell jQuery which vendor-prefixed event name to use, if browser expects one:
        if( prefixedEventName && prefixedEventName !== unprefixedEventName )

          $.event.special[eventName] = {
            bindType    : prefixedEventName,
            delegateType: prefixedEventName
          }

      })

  })


})( this.jQuery, this.Modernizr );