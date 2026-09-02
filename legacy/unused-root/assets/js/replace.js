'use strict';

/******************
Template Name: Centrix
Description: Centrix - Personal CV/Resume HTML Template
Author: Paul
Author URI: http://themeforest.net/user/Paul_tf

1. Common
2. Inits
	2.1 Init parallax
	2.2 Init google map
	2.3 Animsition init
	2.4 AOS init
3. Header
4. Change opacity logo on scroll
5. Fixed footer
6. Mobile menu
7. Hint fields
8. Accordion
9. Carousels
	9.1 Carousel
	9.2 Team carousel
10. Animation of statistics
11. Tooltip pages
12. Masonry
13. Pagepiling
14. Animation of skills
15. Anchor
16. Projects listing

***************/

/*** 1. Common ***/


/*** 2. Inits ***/

/* 2.1 Init parallax */
/*(function() {
	var images = document.querySelectorAll('.__js_parallax img');
	new simpleParallax(images, {
		scale: 1.3
	});
})();*/

/* 2.2 Init google map */
(function() {
	var map = '';

	function initMap() {
		map = new google.maps.Map(document.getElementById("map"), {
			center: {
				lat: -34.397,
				lng: 150.644
			},
			zoom: 8,
		});
	}
})();




(function() {
	var btn = $('.accordion__item-header');
	var modifierClass = 'accordion__item-header--opened';
	var duration = 400; // Smooth animation duration
	var accordionImage = $('#accordion-image');
	var defaultImageSrc = 'assets/img/03.png';

	// Preload accordion images for smoother swaps
	var accordionImageSources = [
		defaultImageSrc,
		'assets/img/04.png',
		'assets/img/strat.png',
		'assets/img/copy.png'
	];

	accordionImageSources.forEach(function(src) {
		var img = new Image();
		img.src = src;
	});

	function swapAccordionImage(targetSrc) {
		if (!accordionImage.length || !targetSrc) return;

		// Avoid unnecessary work if it's already showing this image
		if (accordionImage.attr('src') === targetSrc) return;

		// Start fade-out
		accordionImage.css('opacity', '0');

		// Ensure the new image is loaded before fading back in
		var img = new Image();
		img.onload = function() {
			accordionImage.attr('src', targetSrc);
			// Next paint tick: fade in
			requestAnimationFrame(function() {
				accordionImage.css('opacity', '1');
			});
		};
		img.src = targetSrc;
	}
  
	btn.on('click', function() {
	  var $this = $(this);
	  var isOpen = $this.hasClass(modifierClass);
	  var $accordionItem = $this.closest('.accordion__item');
	  var imageSrc = $accordionItem.attr('data-image');
  
	  // Close all other items
	  btn.removeClass(modifierClass).next('.accordion__item-body').slideUp(duration);
  
	  // Toggle current item
	  if (!isOpen) {
		$this.addClass(modifierClass).next('.accordion__item-body').slideDown(duration);
		// Change image if data-image attribute exists
		if (imageSrc && accordionImage.length) {
		  swapAccordionImage(imageSrc);
		}
	  } else {
		// If closing, reset to default image (first accordion image)
		if (accordionImage.length) {
		  swapAccordionImage(defaultImageSrc);
		}
	  }
	});
  })();


/* 2.3 Animsition init */
(function() {
	$(".animsition").animsition({
		inClass: 'fade-in',
		outClass: 'fade-out',
		inDuration: 1500,
		outDuration: 1000,
		linkElement: '.animsition-link',
		// e.g. linkElement: 'a:not([target="_blank"]):not([href^="#"])'
		loading: true,
		loadingParentElement: 'body', //animsition wrapper element
		loadingClass: 'preloader', //'animsition-loading',
		loadingInner: `<div class="preloader__countdown">
			<span class="preloader__number">100</span>
		</div>`, // e.g '<img src="loading.svg" />
		timeout: false,
		timeoutCountdown: 5000,
		onLoadEvent: true,
		browser: ['animation-duration', '-webkit-animation-duration'],
		// "browser" option allows you to disable the "animsition" in case the css property in the array is not supported by your browser.
		// The default setting is to disable the "animsition" in a browser that does not support "animation-duration".
		overlay: false,
		overlayClass: 'animsition-overlay-slide',
		overlayParentElement: 'body',
		transition: function(url) {
			window.location.href = url;
		}
	});

	// Countdown from 100 to welcome
	(function() {
		var countdownElement = $('.preloader__number');
		var countdown = 100;
		var interval = setInterval(function() {
			if (countdown > 0) {
				countdownElement.text(countdown);
				countdown--;
			} else {
				clearInterval(interval);
				countdownElement.text('WELCOME');
			}
		}, 30); // Update every 30ms for smooth countdown (100 * 30ms = 3 seconds)
	})();
})();

/* 2.4 AOS init */
(function() {
	$('.animsition').on('animsition.inEnd', function() {
		AOS.init({
			duration: 1000
		});
	});
})();

/* 3. Header */
(function() {
	var header = $('.header');
	var leftward = $('.leftward-wrapper');
	var ModifierClass = {
		FIXED: 'header--fixed',
		IS_FIXED: 'is-fixed',
		ABSOLUTE: 'header--absolute',
		WHITE: 'header--white',
		BG_WHITE: 'header--bg-white',
		LEFTWARD: 'header--leftward'
	};
	if (header.length !== 0) {
		var headerClasses = header.hasClass(ModifierClass.BG_WHITE) || header.hasClass(ModifierClass.WHITE) ? ModifierClass.FIXED : ModifierClass.WHITE + ' ' + ModifierClass.FIXED;

		var windowWidth = $(window).width();
		var headerOffset = header.offset().top;
		var scroll = $(window).scrollTop();

		var isScroll = false;
		var isMobileWidth = windowWidth < mobileBreakpoint;
		var isStaticHeader = !header.hasClass(ModifierClass.ABSOLUTE);
		var isLeftwardHeader = header.hasClass(ModifierClass.LEFTWARD);

		$(window).on('animsition.inEnd', function() {
			var Height = {
				HEADER: header.outerHeight(),
				LEFTWARD: leftward.length !== 0 ? leftward.outerHeight() : 0
			};

			changeStateHandler();

			if (isLeftwardHeader && !isMobileWidth) {
				onScrollOne();
			}

			$(window).on('resize', function() {
				if ($(window).width() === mobileBreakpoint) {
					header.attr('hidden', 'true')

					setTimeout(function() {
						header.removeAttr('hidden');
					}, DURATION)
				}
				setTimeout(function() {
					Height.HEADER = header.outerHeight();
					Height.LEFTWARD = leftward.outerHeight();
					windowWidth = $(window).width();
					isMobileWidth = windowWidth < mobileBreakpoint;
					changeStateHandler();
				}, DURATION);
			});

			function changeStateHandler() {
				if (isLeftwardHeader && isMobileWidth || !isLeftwardHeader) {
					resetHeader();
					window.onscroll = onScrollTwo;

				} else {
					resetHeader();
					window.onscroll = onScrollOne;
				}
			}

			function onScrollOne() {
				scroll = $(window).scrollTop();

				if (scroll > Height.LEFTWARD - Height.HEADER) {
					header.css({
						'position': 'absolute',
						'top': 'auto',
						'left': '0',
						'bottom': '0'
					})
				} else {
					header.removeAttr('style');
				}
			}

			function onScrollTwo() {
				scroll = $(window).scrollTop();

				if (scroll >= headerOffset + Height.HEADER) {
					isScroll = true;

					header.addClass(headerClasses);
					Height.HEADER = isScroll ? header.outerHeight() : Height.HEADER;


					if (!header.hasClass(ModifierClass.IS_FIXED)) {
						header.css({
							'top': -Height.HEADER + 'px',
							'transform': ' translateY(' + Height.HEADER + 'px)'
						}).addClass(ModifierClass.IS_FIXED);

						if (isStaticHeader) {
							body.css('padding-top', Height.HEADER + 'px');
						}
					}
				} else {
					isScroll = false;
					header.removeClass(headerClasses + ' ' + ModifierClass.IS_FIXED).removeAttr('style');

					if (isStaticHeader) {
						body.css('padding-top', 0);
					}
				}
			}

			function resetHeader() {
				header.removeClass(headerClasses + ' ' + ModifierClass.IS_FIXED).removeAttr('style');
				body.css('padding-top', '0');
			}
		});
	}
})();

/* Change logo color from black to white on scroll */
(function() {
	var header = $('.header');
	var scrollThreshold = 100; // Change logo color after scrolling 100px

	function updateLogoColor() {
		var scroll = $(window).scrollTop();
		if (scroll > scrollThreshold) {
			header.addClass('header--scrolled');
		} else {
			header.removeClass('header--scrolled');
		}
	}

	$(window).on('scroll', function() {
		updateLogoColor();
	});

	// Check on page load
	updateLogoColor();
})();

/* Hide main-screen section on scroll */
(function() {
	var mainScreen = $('.main-screen');
	var scrollThreshold = 200; // Hide section after scrolling 200px

	function updateMainScreen() {
		var scroll = $(window).scrollTop();
		if (scroll > scrollThreshold) {
			mainScreen.addClass('main-screen--scrolled');
		} else {
			mainScreen.removeClass('main-screen--scrolled');
		}
	}

	$(window).on('scroll', function() {
		updateMainScreen();
	});

	// Check on page load
	updateMainScreen();
})();

/* Animate arrow from right to down on scroll */
(function() {
	var arrowIcon = $('.arrow-link__icon--scroll');
	var scrollThreshold = 100; // Start rotating after scrolling 100px

	function updateArrowRotation() {
		var scroll = $(window).scrollTop();
		if (scroll > scrollThreshold) {
			arrowIcon.addClass('arrow-link__icon--scrolled');
		} else {
			arrowIcon.removeClass('arrow-link__icon--scrolled');
		}
	}

	$(window).on('scroll', function() {
		updateArrowRotation();
	});

	// Check on page load
	updateArrowRotation();
})();

/* Change text to black on scroll (background stays transparent) */
(function() {
	var textSection = $('.text-scroll-change');
	textSection.removeClass('text-scroll-change--scrolled text-scroll-change--locked');
	$('body').removeClass('text-scroll-change--scrolled text-scroll-change--locked');
})();

const randomInt = max => Math.floor(Math.random() * max)
const randomFromArray = array => array[randomInt(array.length)]


























/* 4. scramble effect */


const scrambleText = (text) => {
  const chars = '*?><[]&@#)(.%$-_:/;?!'.split('')
  return text
    .split('')
    .map(x => randomInt(3) > 1 ? randomFromArray(chars) : x)
    .join('')
}

document.querySelectorAll('.scramble').forEach(element => {
  const originalText = element.innerText
  let interval, timeout

  element.addEventListener('mouseover', () => {
    clearInterval(interval)
    clearTimeout(timeout)

    interval = setInterval(() => {
      element.innerText = scrambleText(originalText)
    }, 100)

    timeout = setTimeout(() => {
      clearInterval(interval)
      element.innerText = originalText
    }, 500) // You can change the 300ms here
  })

  element.addEventListener('mouseout', () => {
    clearInterval(interval)
    clearTimeout(timeout)
    element.innerText = originalText
  })
})




let arrow = document.querySelector(".bigicon");
let timer;

window.addEventListener("scroll", () => {
	arrow.classList.add("paused");

	clearTimeout(timer);
	timer = setTimeout(() => {
		arrow.classList.remove("paused");
	}, 100);
});

var body = $('body');
var DURATION = 300;
var preloader = $('.preloader');
var header = $('.header');
var mobileBreakpoint = 992;

function setOverlay(cb) {
	var overlay = $('<div class="overlay"></div>');
	overlay.on('click', cb);
	return overlay;
}

function getScrollbarWidth() {
	var block = $('<div>').css({
		'height': '50px',
		'width': '50px'
	});
	var indicator = $('<div>').css({
		'height': '200px'
	});

	$('body').append(block.append(indicator));

	var w1 = $('div', block).innerWidth();
	block.css('overflow-y', 'scroll');

	var w2 = $('div', block).innerWidth();
	$(block).remove();

	return (w1 - w2);
}

function animate({
	timing,
	draw,
	duration
}) {
	let start = performance.now();

	requestAnimationFrame(function animate(time) {
		let timeFraction = (time - start) / duration;

		if (timeFraction > 1) {
			timeFraction = 1;
		}

		let progress = timing(timeFraction);

		draw(progress);

		if (timeFraction < 1) {
			requestAnimationFrame(animate);
		}
	});
}









const btn = document.querySelector(".btn");
const park_sec = document.querySelectorAll(".park_sec");

var sendFlag = 0;

btn.addEventListener("click",function(){
    this.classList.toggle("active");

    if(sendFlag === 0){
        sendFlag = 1;
        this.textContent = "Hide";
        park_sec.forEach(function(item){
            item.classList.add("active");
        });
    }
    else{
        sendFlag = 0;
        this.textContent = "Show All";
        park_sec.forEach(function(item){
            item.classList.remove("active");
        });
    }
   
});









// "use strict";
// const preview = document.getElementById("preview");
// const upload = document.getElementById("upload");
// const color = document.getElementById("color");
// const filterSelect = document.getElementById("filter-select");
// upload.addEventListener("input", e => {
//     const file = e.target.files[0];
//     if (!file)
//         return;
//     preview.src = URL.createObjectURL(file);
// });
// color.addEventListener("input", e => {
//     const val = color.value;
//     flood.setAttribute('flood-color', val);
//     floodHd.setAttribute('flood-color', val);
// });
// filterSelect.addEventListener("change", setFilter);
// function setFilter() {
//     const val = filterSelect.value;
//     preview.style.filter = val ? `url(#${val})` : "none";
// }
// setFilter();




/* 4. scramble effect */


document.addEventListener("scroll", function() {
  const bigicon = document.querySelector(".bigiconk");
  const arrow = document.querySelector(".icon svg");
  
  // Get element position relative to viewport
  const rect = bigicon.getBoundingClientRect();
  const viewportCenter = window.innerHeight / 2;

  // Check if the element is near the middle of the viewport
  if (rect.top < viewportCenter && rect.bottom > viewportCenter) {
    arrow.style.transform = "rotate(75deg)";
    arrow.style.transformOrigin = "center";
    arrow.style.transformBox = "fill-box"; // ensures SVG rotates around center
  } else {
    arrow.style.transform = "rotate(0deg)"; // reset if not in middle
  }
});











/* 6. Mobile menu */
(function() {
	var menuOpenBtn = $('.menu-toggle');
	var menuCloseBtn = $('.mobile-canvas__close');
	var menu = $('.mobile-canvas');
	var header = $('.header');
	var menu2 = $('.header__menu');
	var headerContainer = $('.header__container');
	var mobileDropdownLinks = $('.navigation__link');

	var menuIsOpened = false;
	var isLeftwardHeader = $('.header').hasClass('header--leftward');

	var ModifierClass = {
		MOBILE_CANVAS: 'mobile-canvas--opened',
		MENU: 'header__menu--opened',
		TOGGLE: 'menu-toggle--opened',
		CURRENT_ITEM: 'navigation__item--current',
		ANIMSITION: 'animsition-link'
	};

	changeClassNavLink();

	menuOpenBtn.on('click', function() {
		if (isLeftwardHeader && $(window).width() < mobileBreakpoint || !isLeftwardHeader) {
			menuIsOpened ? closeMenu() : openMenu();
		} else {
			menuIsOpened ? closeLeftwardHeader() : openLeftwardHeader();
		}
	});

	if (menuCloseBtn.length > 0) {
		menuCloseBtn.on('click', closeMenu);
	}

	mobileDropdownLinks.on('click', openMobile);

	$(window).on('resize', function() {
		var windowWidth = $(window).width();

		if (windowWidth >= mobileBreakpoint && !isLeftwardHeader) {
			closeMenu();
		} else if (isLeftwardHeader) {
			closeLeftwardHeader();
		}

		changeClassNavLink();
	});

	$('main').on('transitionend', removeStyleAttrOnMain);

	function changeClassNavLink() {
		var isMob = $(window).width() < mobileBreakpoint;

		mobileDropdownLinks.each(function() {
			var link = $(this);
			var hasNext = link.next().length !== 0;
			var isActiveParent = link.parent().hasClass(ModifierClass.CURRENT_ITEM);

			if (((isLeftwardHeader || isMob) && hasNext) || isActiveParent) {
				link.removeClass(ModifierClass.ANIMSITION);
			} else if (!isLeftwardHeader && !isMob && !isActiveParent) {
				link.addClass(ModifierClass.ANIMSITION);
			}
		});


	}

	function openMobile(evt) {
		var link = $(this);
		var dropdown = link.next();
		var width = $(window).width();

		if (width < mobileBreakpoint || isLeftwardHeader) {
			if (dropdown.length !== 0) {
				evt.preventDefault();
				var targetParent = link.parent();

				targetParent.siblings().find('.navigation__dropdown').slideUp();
				dropdown.slideToggle();
			}

		}
	}

	function openMenu() {
		var overlay = setOverlay(closeMenu);
		headerContainer.append(overlay);
		menuIsOpened = true;

		setTimeout(function() {
			overlay.fadeIn(DURATION);

			menuOpenBtn.addClass(ModifierClass.TOGGLE);
			if (isLeftwardHeader) {
				menu2.addClass(ModifierClass.MENU);
			} else {
				menu.addClass(ModifierClass.MOBILE_CANVAS);
			}
		}, DURATION + 50);
	}

	function closeMenu() {
		if (isLeftwardHeader) {
			menu2.removeClass(ModifierClass.MENU);
		} else {
			menu.removeClass(ModifierClass.MOBILE_CANVAS);
		}

		menuOpenBtn.removeClass(ModifierClass.TOGGLE);
		var overlay = $('.overlay').fadeOut(DURATION);
		menuIsOpened = false;

		setTimeout(function() {
			overlay.remove();
		}, DURATION + 50);
	}

	function openLeftwardHeader() {
		menuOpenBtn.addClass(ModifierClass.TOGGLE);
		header.addClass('shifted');
		header.next().css('transform', 'translateX(300px)');
		body.css({
			'overflow': 'hidden',
			'margin-right': getScrollbarWidth() + 'px'
		});
		menuIsOpened = true;


		changeFixedElement(true);
	}

	function closeLeftwardHeader() {
		menuOpenBtn.removeClass(ModifierClass.TOGGLE);
		header.removeClass('shifted');
		header.next().css('transform', 'translateX(0)');

		setTimeout(function() {
			body.css({
				'overflow': '',
				'margin-right': '0'
			});
			menuIsOpened = false;
		}, DURATION + 50);


	}

	function changeFixedElement(isOpen) {
		var aside = $('.projects-listing__aside');

		if (aside.length !== 0) {
			var scroll = $(window).scrollTop();
			var parentOffsetTop = aside.parent().offset().top;
			var left = aside.parent().css('padding-left');
			var offsetTop = scroll > parentOffsetTop ? scroll - parentOffsetTop : scroll;

			if (isOpen) {
				aside.css({
					'position': 'absolute',
					'left': left,
					'top': offsetTop + 'px'
				})
			}
		}
	}

	function removeStyleAttrOnMain() {
		var style = $(this).attr('style');

		if (style === 'transform: translateX(0px);') {
			$(this).removeAttr('style');
		}
	}
})();



class TextScramble {
	constructor(el) {
	  this.el = el
	  this.chars = '!<>-_\\/[]{}—=+*^?#________'
	  this.update = this.update.bind(this)
	}
	setText(newText) {
	  const oldText = this.el.innerText
	  const length = Math.max(oldText.length, newText.length)
	  const promise = new Promise((resolve) => this.resolve = resolve)
	  this.queue = []
	  for (let i = 0; i < length; i++) {
		const from = oldText[i] || ''
		const to = newText[i] || ''
		const start = Math.floor(Math.random() * 40)
		const end = start + Math.floor(Math.random() * 40)
		this.queue.push({ from, to, start, end })
	  }
	  cancelAnimationFrame(this.frameRequest)
	  this.frame = 0
	  this.update()
	  return promise
	}
	update() {
	  let output = ''
	  let complete = 0
	  for (let i = 0, n = this.queue.length; i < n; i++) {
		let { from, to, start, end, char } = this.queue[i]
		if (this.frame >= end) {
		  complete++
		  output += to
		} else if (this.frame >= start) {
		  if (!char || Math.random() < 0.28) {
			char = this.randomChar()
			this.queue[i].char = char
		  }
		  output += `<span class="dud">${char}</span>`
		} else {
		  output += from
		}
	  }
	  this.el.innerHTML = output
	  if (complete === this.queue.length) {
		this.resolve()
	  } else {
		this.frameRequest = requestAnimationFrame(this.update)
		this.frame++
	  }
	}
	randomChar() {
	  return this.chars[Math.floor(Math.random() * this.chars.length)]
	}
  }
  
  
  const phrases = [
	'Designer',
	'Thinker',
	'Manager',
	'Inovator',
	'connect',
  ]
  
  const el = document.querySelector('.text')
  const fx = new TextScramble(el)
  
  let counter = 0
  const next = () => {
	fx.setText(phrases[counter]).then(() => {
	  setTimeout(next, 1900)
	})
	counter = (counter + 1) % phrases.length
  }
  
  next()
  




/* 4. Change opacity logo on scroll */
(function() {
	var logo = $('.vertical-logo');

	if (logo.length !== 0) {
		var logoLayer = logo.find('.vertical-logo__layer--yellow');
		var logoHeight = logo.outerHeight();
		var logoOffset = logo.offset().top;
		var shift = $('.header').outerHeight() * 2;
		var distance = (logoHeight + logoOffset) - shift;

		function changeOpacity(scroll) {
			var percent = scroll * 100 / distance;
			logoLayer.css('opacity', percent / 100);

			let opacity = logoLayer.css('opacity');

			if (scroll >= distance && opacity < 1) {
				logoLayer.css('opacity', '1');
			}
		}

		$(window).on('scroll', function() {
			var scroll = $(window).scrollTop();
			changeOpacity(scroll);
		});

		$(window).on('resize', function() {
			var scroll = $(window).scrollTop();

			logoHeight = logo.outerHeight();
			logoOffset = logo.offset().top;
			shift = $('.header').outerHeight() * 2;
			distance = (logoHeight + logoOffset) - shift;

			changeOpacity(scroll);
		});
	}

})();

/* 5. Fixed footer */
(function() {

	$(window).on('load', function() {
		var footer = $('.__js_fixed-footer');
		var footerHeight = footer.innerHeight();

		if (footer.length !== 0 && $(window).width() >= mobileBreakpoint) {
			if (footerHeight <= $(window).height()) {
				footer.css({
					'position': 'fixed',
					'left': '0',
					'right': '0',
					'bottom': '0'
				});
				body.css('padding-bottom', footerHeight);
			} else {
				body.css('padding-bottom', '0');
				footer.removeAttr('style')
			}

			$(window).on('resize', function() {
				footerHeight = footer.innerHeight();

				if (footerHeight <= $(window).height()) {
					footer.css({
						'position': 'fixed',
						'left': '0',
						'right': '0',
						'bottom': '0'
					});
					body.css('padding-bottom', footerHeight);
				} else {
					body.css('padding-bottom', '0');
					footer.removeAttr('style');
				}
			});
		}
	});
})();



/* 7. Hint fields */
(function() {
	var fields = $('.field input, .field textarea');
	//var fields = $('.field input').add('.field textarea');
	var ModifierClass = 'field--filled';

	function toggleFilledClass(field) {
		if ($(field).val().trim()) {
			$(field).parent().addClass(ModifierClass);
		} else {
			$(field).parent().removeClass(ModifierClass);
		}
	}

	fields.on('input', function() {
		toggleFilledClass(this);
	});

	fields.on('blur', function() {
		toggleFilledClass(this);
	});

	// Initialize on page load for fields that already have values
	fields.each(function() {
		toggleFilledClass(this);
	});
})();

/* 8. Accordion */


/*** 9. Carousels ***/

/* 9.1 Carousel */
(function() {
	var carouselSelectors = ['.__js_carousel-latest-news', '.__js_carousel-latest-projects'];

	var carousel = new Swiper('.__js_carousel', {
		slidesPerView: 'auto',
		spaceBetween: 60,
		loop: true,
		navigation: {
			nextEl: '.carousel__btn--next',
			prevEl: '.carousel__btn--prev',
		},
	});

	carouselSelectors.forEach(function(selector) {
		new Swiper(selector, {
			slidesPerView: 'auto',
			spaceBetween: 60,
			loop: true,
			navigation: {
				nextEl: '.nav-btn--next[data-target="' + selector + '"]',
				prevEl: '.nav-btn--prev[data-target="' + selector + '"]',
			},
		});
	});
})();

/* 9.2 Team carousel */
(function() {
	var carouselSelector = '.__js_team-carousel-only-mobile';
	var carousel;

	if ($(carouselSelector).length > 0) {

		initTeamCarousel();

		$(window).resize(function() {
			initTeamCarousel();
		});
	}

	function initTeamCarousel() {
		if (window.matchMedia('(min-width: 576px)').matches && carousel) {
			carousel.destroy();
			carousel = null;

		} else if (window.matchMedia('(max-width: 575px)').matches && carousel !== null) {
			carousel = new Swiper(carouselSelector, {
				speed: 300,
				slidesPerView: 'auto',
				spaceBetween: 40,
				loop: true
			});
		}
	}
})();

/* 10. Animation of statistics */
(function() {
	$(window).on('load', function() {
		var statistics = $('.statistics');
		var numbers = $('.__js_number');
		var animationIsDone = false;
		var scroll = $(window).scrollTop() + $(window).height();

		if ($('*').is('.statistics')) {
			var offset = statistics.offset().top;

			if (!animationIsDone && scroll >= offset) {
				animateNumbers();
			}

			$(window).on('scroll', function() {
				scroll = $(window).scrollTop() + $(window).height();

				if (!animationIsDone && scroll >= offset) {
					animateNumbers();
				}
			});
		}

		function animateNumbers() {
			numbers.each(function() {
				var endValue = parseInt($(this).attr('data-end-value'), 10);

				$(this).easy_number_animate({
					start_value: 0,
					end_value: endValue,
					duration: 1800
				});

			});

			animationIsDone = true;
		}
	});
})();

/* 11. Tooltip pages */
(function() {
	var windowWidth = $(window).width();

	var marqueeSpeed = windowWidth < mobileBreakpoint ? 10000 : 25000;

	$('.__js-marquee').on('beforeStarting', function() {
		var item = $('.tooltip__item');
		item.on('mouseover', onMarqueeItemHover);
	}).marquee({
		//speed in milliseconds of the marquee
		duration: marqueeSpeed,
		//gap in pixels between the tickers
		gap: 0,
		//time in milliseconds before the marquee will start animating
		delayBeforeStart: 0,
		//'left' or 'right'
		direction: 'left',
		//true or false - should the marquee be duplicated to show an effect of continues flow
		duplicated: true,
		startVisible: true
	});

	$('.__js-marquee--reverse').on('beforeStarting', function() {
		var item = $('.tooltip__item');
		item.on('mouseover', onMarqueeItemHover);
	}).marquee({
		//speed in milliseconds of the marquee
		duration: marqueeSpeed,
		//gap in pixels between the tickers
		gap: 0,
		//time in milliseconds before the marquee will start animating
		delayBeforeStart: 0,
		//'left' or 'right'
		direction: 'right',
		//true or false - should the marquee be duplicated to show an effect of continues flow
		duplicated: true,
		startVisible: true
	});

	function onMarqueeItemHover() {
		var current = $(this);
		var parent = current.closest('.tooltip__marquee');
		var imageData = {
			url: current.attr('data-image'),
			url2x: current.attr('data-image2x'),
			w: current.attr('data-image-w'),
			h: current.attr('data-image-h'),
			isWebp: current.attr('data-webp')
		};

		var itemCard = createItemCard(imageData);

		parent.marquee('pause');
		current.append(itemCard);
		var card = current.find('.tooltip__card');

		current.on('mousemove', function(evt) {
			var x = evt.pageX - current.offset().left;
			var y = evt.pageY - current.offset().top;
			card.css({
				'left': x + 'px',
				'top': y + 'px'
			});
		});

		current.on('mouseout', function() {
			parent.marquee('resume');
			card.remove();
		});
	}

	function createItemCard(imageData) {
		if (imageData.url) {
			var card = $('<div class="tooltip__card"></a>');
			var format = imageData.url.slice(imageData.url.lastIndexOf('.'));

			var path = {
				'1x': imageData.url.slice(0, -format.length),
				'2x': imageData.url2x ? imageData.url2x.slice(0, -format.length) : imageData.url.slice(0, -format.length)
			};

			if (imageData.isWebp) {

				var image = $('<picture><source type="image/webp" srcset="' + path['1x'] + '.webp 1x, ' + path['2x'] + '.webp 2x"><img src="' + path['1x'] + format + '" srcset="' + path['2x'] + format + ' 2x" width="' + imageData.w + '" height="' + imageData.h + '" alt=""></picture>');

			} else {

				var image = $('<img src="' + path['1x'] + format + '" srcset="' + path['2x'] + format + ' 2x" width="' + imageData.w + '" height="' + imageData.h + '" alt="">');

			}

			card.append(image);
			card.css({
				'position': 'absolute'
			})

			return card;
		}
	}
})();

/* 12. Masonry */
(function() {
	$(window).on('load', function() {
		var filterItem = $('.filter__item');
		var filterItemAll = $('.filter__item[data-filter="*"]');
		var filterActiveClass = 'filter__item--active';

		var grid = $('.__js_blog-grid, .__js_portfolio-section-masonry').isotope({
			itemSelector: '.__js_masonry-item',
			layoutMode: 'packery',
			packery: {
				gutter: 0
			},
		});

		filterItem.on('click', function() {
			var filterValue = $(this).attr('data-filter');

			$(this).addClass(filterActiveClass).siblings().removeClass(filterActiveClass);
			grid.isotope({
				filter: filterValue
			});
		});
	});
})();

/* 13. Pagepiling */
(function() {
	var headerClasses = $('.header').attr('class');

	initFullPage();

	if ($('#pagepiling .section.active').hasClass('dark')) {
		setDark();
	}

	function initFullPage() {
		if ($('#pagepiling') && $('#pagepiling').length > 0) {
			$('#pagepiling').pagepiling({
				scrollingSpeed: 280,
				loopBottom: true,
				navigation: false,
				afterRender: function() {
					$('.parallax-projects__nav span').height($('.parallax-projects__nav').height() / $('#pagepiling .section').length);
				},
				afterLoad: function(anchorLink, index) {
					var current = $('#pagepiling .section.active');

					if (current.hasClass('dark')) {
						setDark();
					} else {
						removeDark();
					}

					$('.fp-table.active .aos-init').addClass('aos-animate');

					$('.parallax-projects__nav span').height($('.parallax-projects__nav').height() / $('#pagepiling .section').length * index);
				}
			});
		}
	}

	function setDark() {
		$('.webpage').addClass('webpage--parallax-dark');
		$('.header').removeClass('header--white');
	}

	function removeDark() {
		$('.webpage').removeClass('webpage--parallax-dark');
		$('.header').addClass(headerClasses);
	}
})();

/* 14. Animation of skills */
(function() {
	$(window).on('load', function() {
		var skills = $('.skills');
		var skill = $('.skill');
		var numbers = $('.skill .__js_number');
		var animationIsDone = false;
		var scroll = $(window).scrollTop() + $(window).height();

		var duration = 1800;

		if ($('*').is('.skills')) {
			var offset = skills.offset().top;

			if (!animationIsDone && scroll >= offset) {
				animateNumbers();
				animateProgress();
			}

			$(window).on('scroll', function() {
				scroll = $(window).scrollTop() + $(window).height();

				if (!animationIsDone && scroll >= offset) {
					animateNumbers();
					animateProgress();
				}
			});
		}

		function animateNumbers() {
			numbers.each(function() {
				var endValue = parseInt($(this).parent().parent().parent().attr('data-percent'), 10);

				$(this).easy_number_animate({
					start_value: 0,
					end_value: endValue,
					duration: 1800
				});

			});

			animationIsDone = true;
		}

		function animateProgress() {
			skill.each(function() {
				var current = $(this);
				var progress = current.find('.skill__progress');
				var percent = parseInt(current.attr('data-percent'), 10);

				progress.attr('style', 'transform: scale(' + (percent / 100) + ', 1)')
			});
		}
	});
})();

/* 15. Anchor */
(function() {
	anchorScroll($('.anchor'));

	function anchorScroll(e) {
		e.on('click', function() {
			var link = $(this).attr('href'),
				to = $(link).offset().top;
			$('body, html').animate({
				scrollTop: to
			}, 800);
		});
	}
})();

/* 16. Projects listing */
(function() {
	var container = $('.projects-listing__container');

	if (container.length !== 0) {
		var aside = $('.projects-listing__aside');
		var title = $('.projects-listing__title');
		var category = $('.projects-listing__category');
		var btn = $('.projects-listing__more');
		var cards = $('.project-card');
		var isFixed = false;

		var currentCard = cards[0];
		var hideClass = 'd-none';
		var containerParams = {
			TOP: container.offset().top,
			LEFT: container.offset().left,
			HEIGHT: container.height(),
			WIDTH: container.width(),
			BOTTOM: container.offset().top + container.height(),
			LEFT_PADDING: parseInt(container.css('padding-left'), 10)
		};

		var maxTop = $(window).width() >= 768 ? $(cards[cards.length - 1]).offset().top - containerParams.TOP : containerParams.BOTTOM - aside.outerHeight();

		function changeProjectMeta() {
			title.html(currentCard.attr('data-title'));
			btn.attr('href', currentCard.attr('data-url'));

			if (currentCard.attr('data-category')) {
				category.removeClass(hideClass).text(currentCard.attr('data-category'));
			} else {
				category.addClass(hideClass).text('');
			}
		}

		function changeCurrentCard(index, item) {
			if (aside.offset().top >= item.offset().top) {
				currentCard = item;
				changeProjectMeta();
			}
		}

		$(window).on('scroll', function() {
			var scroll = $(window).scrollTop();
			isFixed = scroll > containerParams.TOP && scroll <= maxTop;

			if ($(window).width() >= 768) {
				if (isFixed) {
					aside.css({
						'position': 'fixed',
						'left': (containerParams.LEFT + containerParams.LEFT_PADDING) + 'px',
						'top': '0',
						'transform': 'translateY(' + containerParams.TOP + 'px)'
					});

				} else {
					var top = scroll >= maxTop ? maxTop : 0;
					var y = scroll >= maxTop ? containerParams.TOP + 'px' : 0;
					aside.css({
						'position': 'absolute',
						'left': containerParams.LEFT_PADDING + 'px',
						'top': top + 'px',
						'transform': 'translateY(' + y + ')'
					});
				}
			} else {
				var targetScroll = scroll + $(window).height() - aside.outerHeight();
				if (targetScroll >= maxTop) {
					var top = targetScroll >= maxTop ? maxTop - containerParams.TOP + 'px' : 0;
					aside.css({
						'position': 'absolute',
						'top': top,
						'bottom': 'auto',
						'right': ''
					})
				} else {
					aside.removeAttr('style');
				}
			}

			cards.each(function(index) {
				var i = index;
				changeCurrentCard(i, $(this));
			});
		});

		$(window).on('resize', function() {
			var scroll = $(window).scrollTop();
			containerParams = {
				TOP: container.offset().top,
				LEFT: container.offset().left,
				HEIGHT: container.height(),
				WIDTH: container.width(),
				BOTTOM: container.offset().top + container.height(),
				LEFT_PADDING: parseInt(container.css('padding-left'), 10)
			};

			maxTop = $(window).width() >= 768 ? $(cards[cards.length - 1]).offset().top - containerParams.TOP : containerParams.BOTTOM - aside.outerHeight();
			isFixed = scroll > containerParams.TOP && scroll <= maxTop;

			aside.removeAttr('style');
		});
	}
})();









// MAIN PART FOR THE VIDEO AND PLAY BUTTON

const videoContainer = document.getElementById("video-container");
const playButton = document.getElementById("play-button");

videoContainer.addEventListener("mousemove", function (event) {
	const containerRect = videoContainer.getBoundingClientRect();
	const mouseX = event.clientX - containerRect.left;
	const mouseY = event.clientY - containerRect.top;

	const buttonWidth = playButton.offsetWidth;
	const buttonHeight = playButton.offsetHeight;
	const buttonX = mouseX - buttonWidth / 2;
	const buttonY = mouseY - buttonHeight / 2;

	const maxButtonX = containerRect.width - buttonWidth;
	const maxButtonY = containerRect.height - buttonHeight;
	playButton.style.left = Math.min(Math.max(buttonX, 0), maxButtonX) + "px";
	playButton.style.top = Math.min(Math.max(buttonY, 0), maxButtonY) + "px";
});

videoContainer.addEventListener("mouseleave", function () {
	setTimeout(function () {
		playButton.style.left = "50%";
		playButton.style.top = "50%";
		playButton.style.transform = "translate(-50%, -50%) scale(1)";
		playButton.style.transition = "all 0.3s ease-out";
	}, 50);
});

videoContainer.addEventListener("mouseover", function () {
	playButton.style.transition = "transform ease-out 0.3s";
	playButton.style.transform = "scale(1.2)";
});

const video = document.getElementById("video");

videoContainer.addEventListener("mouseenter", function () {
	if (!video.paused) {
		playButton.style.opacity = "1";
	}
});

videoContainer.addEventListener("mouseleave", function () {
	if (!video.paused) {
		playButton.style.opacity = "0";
		playButton.style.transition = "opacity ease 1s";
	}
});

videoContainer.addEventListener("click", function () {
	if (video.paused) {
		video.play();
		playButton.innerHTML =
			'<span class="pause-icon"><i class="fa fa-solid fa-pause"></i></span>';
	} else {
		video.pause();
		playButton.innerHTML =
			'<span class="play-icon"><i class="fa fa-solid fa-play"></i></span>';
	}
});

video.addEventListener("ended", function () {
	playButton.innerHTML =
		'<span class="play-icon"><i class="fa fa-solid fa-play"></i></span>';
	playButton.style.opacity = "1";
});

// END OF MAIN PART FOR THE VIDEO AND PLAY BUTTON

// Optional - Code for inputting video
const videoSource = document.getElementById("video-source");
const videoUrl = document.getElementById("video-url");
const loadButton = document.getElementById("load-button");

function loadVideo() {
	const url = videoUrl.value.trim();
	if (!url) return;
	videoSource.setAttribute("src", url);
	video.load();
	video.play();
}

loadButton.addEventListener("click", function () {
	loadVideo();
	video.play();
	playButton.innerHTML =
		'<span class="pause-icon"><i class="fa fa-solid fa-pause">	</i></span>';
	playButton.style.opacity = "0";
	playButton.style.transition = "opacity ease 1s";
});



const cursor = document.querySelector(".cursor");
const follower = document.querySelector(".cursor-follower");
const card = document.querySelectorAll(".card");

let posX = 0,
	posY = 0,
	mouseX = 0,
	mouseY = 0;

TweenMax.to({}, 0.02, {
	repeat: -1,
	onRepeat: function () {
		posX += (mouseX - posX) / 9;
		posY += (mouseY - posY) / 9;

		TweenMax.set(follower, {
			css: {
				left: posX - 20,
				top: posY - 20
			}
		});

		TweenMax.set(cursor, {
			css: {
				left: mouseX,
				top: mouseY
			}
		});
	}
});

document.addEventListener("mousemove", (e) => {
	mouseX = e.pageX;
	mouseY = e.pageY;
});

card.forEach((el) => {
	el.addEventListener("mouseenter", () => {
		cursor.classList.add("active");
		follower.classList.add("active");
	});

	el.addEventListener("mouseleave", () => {
		cursor.classList.remove("active");
		follower.classList.remove("active");
	});
});


console.clear();
new SplitText("h1", { type: "lines", linesClass: "lineChild" });
new SplitText("h1", { type: "lines", linesClass: "lineParent" });
gsap.from(".lineChild", {
  duration: 0.75,
  yPercent: 100,
  stagger: 0.25,
  repeat: -0,
  repeatDelay: 0.5,
  yoyo: true
});





// Auto resize input
function resizeInput() {
    $(this).attr('size', $(this).val().length);
}

$('input[type="text"], input[type="email"]')
    // event handler
    .keyup(resizeInput)
    // resize on page load
    .each(resizeInput);


// Realtime clock and location
(function() {
  function updateClock() {
    var now = new Date();
    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');
    var seconds = String(now.getSeconds()).padStart(2, '0');
    var dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    var timeStr = hours + ':' + minutes + ':' + seconds;
    
    var clockElement = document.getElementById('realtime-clock');
    if (clockElement) {
      clockElement.textContent = dateStr + ' ' + timeStr;
    }
  }
  
  function updateLocation() {
    var locationElement = document.getElementById('location-info');
    if (locationElement && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(position) {
          // Get approximate location name (simplified - you might want to use a geocoding API)
          var lat = position.coords.latitude.toFixed(2);
          var lon = position.coords.longitude.toFixed(2);
          locationElement.textContent = lat + ', ' + lon;
        },
        function(error) {
          locationElement.textContent = 'Location unavailable';
        }
      );
    } else if (locationElement) {
      locationElement.textContent = 'Location unavailable';
    }
  }
  
  // Update clock every second
  updateClock();
  setInterval(updateClock, 1000);
  
  // Update location on page load
  updateLocation();
})();

console.clear();
// Adapted from georgepapadakis.me/demo/expanding-textarea.html
(function(){
  
  var textareas = document.querySelectorAll('.expanding'),
      
      resize = function(t) {
        t.style.height = 'auto';
        t.style.overflow = 'hidden'; // Ensure scrollbar doesn't interfere with the true height of the text.
        t.style.height = (t.scrollHeight + t.offset ) + 'px';
        t.style.overflow = '';
      },
      
      attachResize = function(t) {
        if ( t ) {
          console.log('t.className',t.className);
          t.offset = !window.opera ? (t.offsetHeight - t.clientHeight) : (t.offsetHeight + parseInt(window.getComputedStyle(t, null).getPropertyValue('border-top-width')));

          resize(t);

          if ( t.addEventListener ) {
            t.addEventListener('input', function() { resize(t); });
            t.addEventListener('mouseup', function() { resize(t); }); // set height after user resize
          }

          t['attachEvent'] && t.attachEvent('onkeyup', function() { resize(t); });
        }
      };
  
  // IE7 support
  if ( !document.querySelectorAll ) {
  
    function getElementsByClass(searchClass,node,tag) {
      var classElements = new Array();
      node = node || document;
      tag = tag || '*';
      var els = node.getElementsByTagName(tag);
      var elsLen = els.length;
      var pattern = new RegExp("(^|\\s)"+searchClass+"(\\s|$)");
      for (i = 0, j = 0; i < elsLen; i++) {
        if ( pattern.test(els[i].className) ) {
          classElements[j] = els[i];
          j++;
        }
      }
      return classElements;
    }
    
    textareas = getElementsByClass('expanding');
  }
  
  for (var i = 0; i < textareas.length; i++ ) {
    attachResize(textareas[i]);
  }
  
})();
