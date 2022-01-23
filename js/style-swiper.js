/*
* style-swiper v1.1.0 Copyright (c) 2020 AJ Savino
* https://github.com/koga73/style-swiper
* MIT License
*/
//You can pass in "params" object to overwrite properties on instance
//Additionally you can change the scope from document to custom via params.el
var StyleSwiper = function(params){
	var _instance = null;

	var _vars = {
		debug:false,

		attributePageNum:StyleSwiper.DEFAULT_ATTRIBUTE_PAGE_NUM,

		events:false, //Fire events
		eventChangeVisible:StyleSwiper.DEFAULT_EVENT_CHANGE_VISIBLE,
		eventChangeActive:StyleSwiper.DEFAULT_EVENT_CHANGE_ACTIVE,

		classSlides:StyleSwiper.DEFAULT_CLASS_SLIDES,
		classBtnPrev:StyleSwiper.DEFAULT_CLASS_BTN_PREV,
		classBtnNext:StyleSwiper.DEFAULT_CLASS_BTN_NEXT,
		classPagination:StyleSwiper.DEFAULT_CLASS_PAGINATION,
		classPage:StyleSwiper.DEFAULT_CLASS_PAGE,
		classVisible:StyleSwiper.DEFAULT_CLASS_VISIBLE,
		classActive:StyleSwiper.DEFAULT_CLASS_ACTIVE,
		classHidden:StyleSwiper.DEFAULT_CLASS_HIDDEN,

		scrollDirection:StyleSwiper.DIRECTION.HORIZONTAL,
		scrollBehavior:"smooth",
		scrollDebounce:100, //ms

		//Elements
		_containerEl:null,
		_slideEl:null,
		_btnPrevEl:null,
		_btnNextEl:null,
		_paginationEl:null,

		//Cache
		_slides:[],
		_slidesBounds:[],
		_pages:[],

		_resizer:null,
		_scrollTimeout:0,

		_activeIndex:0
	};

	var _methods = {
		init:function(el){
			if (_instance.debug){
				console.log("StyleSwiper::init", el);
			}

			el = el || document;
			if (el === document){
				console.warn("Did you mean to pass 'document' to StyleSwiper?");
			}
			_vars._containerEl = el;

			if (typeof Resizer !== typeof undefined){
				_vars._resizer = new Resizer({onResize:_methods._handler_resize});
			}

			_instance.updateSlides();
			_instance.evalVisibility();
			_instance.evalActive();
		},

		destroy:function(){
			if (_instance.debug){
				console.log("StyleSwiper::destroy");
			}

			_vars._slideEl.removeEventListener("scroll", _methods._handler_scroll);

			clearTimeout(_vars._scrollTimeout);
			if (_vars._resizer){
				_vars._resizer.destroy();
				_vars._resizer = null;
			}

			_methods._clearPages();
			_vars._pages = [];
			_vars._paginationEl = null;

			if (_vars._btnPrevEl){
				_vars._btnPrevEl.removeEventListener("click", _methods._handler_prev_click);
			}
			_vars._btnPrevEl = null;

			if (_vars._btnNextEl){
				_vars._btnNextEl.removeEventListener("click", _methods._handler_next_click);
			}
			_vars._btnNextEl = null;

			_vars._slidesBounds = [];
			_vars._slides = [];
			_vars._slideEl = null;
			_vars._containerEl = null;
		},

		_clearPages:function(){
			if (_instance.debug){
				console.log("StyleSwiper::clearPages");
			}

			if (!_vars._paginationEl){
				return;
			}
			while (_vars._paginationEl.firstChild) {
				_vars._paginationEl.firstChild.removeEventListener("click", _methods._handler_page_click);
				_vars._paginationEl.removeChild(_vars._paginationEl.firstChild);
			}
		},

		getSlides:function(){
			var slides = _vars._slides;

			if (_instance.debug){
				console.log("StyleSwiper::getSlides", slides);
			}

			return slides;
		},

		getVisible:function(){
			var visible = _vars._slideEl.querySelectorAll("." + _instance.classVisible);

			if (_instance.debug){
				console.log("StyleSwiper::getVisible", visible);
			}

			return visible;
		},

		getActive:function(){
			var active = _vars._slideEl.querySelector("." + _instance.classActive);

			if (_instance.debug){
				console.log("StyleSwiper::getActive", active);
			}

			return active;
		},

		getActiveIndex:function(){
			var activeIndex = _vars._activeIndex;

			if (_instance.debug){
				console.log("StyleSwiper::getActive", activeIndex);
			}

			return activeIndex;
		},

		updateSlides:function(){
			//_slideEl + _slides
			_vars._slideEl = _vars._containerEl.querySelector("." + _instance.classSlides);
			if (_vars._slideEl.children && _vars._slideEl.children.length){
				_vars._slides = _vars._slideEl.children;
			} else {
				_vars._slides = [];
			}
			if (_instance.debug){
				console.log("StyleSwiper::updateSlides", _vars._slides);
			}
			var slidesLen = _vars._slides.length;
			if (!slidesLen){
				console.warn("No slides in swiper:\n", _vars._slideEl);
			}

			//_btnPrevEl
			_vars._btnPrevEl = _vars._containerEl.querySelector("." + _instance.classBtnPrev);
			if (_vars._btnPrevEl){
				_vars._btnPrevEl.addEventListener("click", _methods._handler_prev_click);
			}
			if (_instance.debug){
				console.log("StyleSwiper::updateSlides", "found prev button");
			}

			//_btnNextEl
			_vars._btnNextEl = _vars._containerEl.querySelector("." + _instance.classBtnNext);
			if (_vars._btnNextEl){
				_vars._btnNextEl.addEventListener("click", _methods._handler_next_click);
			}
			if (_instance.debug){
				console.log("StyleSwiper::updateSlides", "found next button");
			}

			//_paginationEl + _pages
			_vars._paginationEl = _vars._containerEl.querySelector("." + _instance.classPagination);
			if (_vars._paginationEl){
				_methods._clearPages();
				_vars._pages = [];

				for (var i = 0; i < slidesLen; i++){
					var btn = document.createElement("button");
					btn.setAttribute(_instance.attributePageNum, i);
					btn.setAttribute("title", "slide " + (i + 1));
					btn.addEventListener("click", _methods._handler_page_click);

					var page = document.createElement("li");
					page.classList.add(_instance.classPage);
					page.appendChild(btn);

					_vars._pages.push(page);
					_vars._paginationEl.appendChild(page);
				}
				if (_instance.debug){
					console.log("StyleSwiper::updateSlides", "created pagination", _vars._pages);
				}
			}

			//Add listeners
			if (slidesLen){
				_vars._slideEl.addEventListener("scroll", _methods._handler_scroll);
			} else {
				_vars._slideEl.removeEventListener("scroll", _methods._handler_scroll);
			}

			if (!_vars._resizer){
				console.warn("Resizer excluded - cache disabled");
				_vars._slidesBounds = null;
				return;
			}

			//Cache bounds
			if (_instance.debug){
				console.log("StyleSwiper::updateSlides", "cache bounds");
			}
			_vars._slidesBounds = [];
			for (var i = 0; i < slidesLen; i++){
				_vars._slidesBounds.push(_methods._getBounds(_vars._slides[i]));
			}
		},

		_getBounds:function(el){
			//From cache
			var bounds = null;
			if (_vars._slidesBounds){
				var slidesBoundsLen = _vars._slidesBounds.length;
				for (var i = 0; i < slidesBoundsLen; i++){
					if (_vars._slides[i] == el){
						bounds = _vars._slidesBounds[i];
						break;
					}
				}
			}
			if (!bounds){
				bounds = [
					el.offsetLeft, //Left
					el.offsetTop, //Top
					el.offsetLeft + el.clientWidth, //Right
					el.offsetTop + el.clientHeight, //Bottom
				];
				if (_instance.debug){
					console.log("StyleSwiper::_getBounds", el, bounds);
				}
			}
			return bounds;
		},

		isVisible:function(el){
			var scrollBounds = _methods._getScrollBounds();
			var elBounds = _methods._getBounds(el);

			//Check bounding box
			var isVisible = false;
			var inBoundX = (elBounds[0] >= scrollBounds[0] && elBounds[0] < scrollBounds[2]) || (elBounds[2] > scrollBounds[0] && elBounds[2] < scrollBounds[2]) || (scrollBounds[0] >= elBounds[0] && scrollBounds[0] < elBounds[2]) || (scrollBounds[2] > elBounds[0] && scrollBounds[2] < elBounds[2]);
			var inBoundY = (elBounds[1] >= scrollBounds[1] && elBounds[1] < scrollBounds[3]) || (elBounds[3] > scrollBounds[1] && elBounds[3] < scrollBounds[3]) || (scrollBounds[1] >= elBounds[1] && scrollBounds[1] < elBounds[3]) || (scrollBounds[3] > elBounds[1] && scrollBounds[3] < elBounds[3]);
			if (inBoundX && inBoundY){
				isVisible = true;
			}
			if (_instance.debug){
				console.log("StyleSwiper::isVisible", el, isVisible);
			}
			return isVisible;
		},

		_handler_scroll:function(evt){
			//Debounce
			if (_instance.scrollDebounce){
				if (_vars._scrollTimeout){
					clearTimeout(_vars._scrollTimeout);
				}
				_vars._scrollTimeout = setTimeout(_methods._handler_scroll_timeout, _instance.scrollDebounce);
			} else {
				_methods._handler_scroll_timeout();
			}
		},

		_handler_scroll_timeout:function(){
			if (_instance.debug){
				console.log("StyleSwiper::_handler_scroll_timeout");
			}

			clearTimeout(_vars._scrollTimeout);

			_instance.evalVisibility();
			_instance.evalActive();
		},

		_handler_resize:function(width, height){
			if (_instance.debug){
				console.log("StyleSwiper::_handler_resize", width, height);
			}
			_instance.updateSlides();
			_instance.goto(_vars._activeIndex, true); //noScroll
		},

		_getScrollBounds:function(){
			var scrollBounds = null;
			if (_vars._containerEl == document){
				var left = document.body.scrollLeft || document.documentElement.scrollLeft;
				var top = document.body.scrollTop || document.documentElement.scrollTop;
				scrollBounds = [
					left, //Left
					top, //Top
					left + window.innerWidth, //Right
					top + window.innerHeight //Bottom
				];
			} else {
				switch (_instance.scrollDirection){
					default:
					case StyleSwiper.DIRECTION.HORIZONTAL:
						scrollBounds = [
							_vars._slideEl.scrollLeft, //Left
							0, //Top
							_vars._slideEl.scrollLeft + _vars._slideEl.clientWidth, //Right
							_vars._slideEl.scrollTop + _vars._slideEl.clientHeight, //Bottom
						];
						break;
					case StyleSwiper.DIRECTION.VERTICAL:
						scrollBounds = [
							0, //Left
							_vars._slideEl.scrollTop, //Top
							_vars._slideEl.scrollLeft + _vars._slideEl.clientWidth, //Right
							_vars._slideEl.scrollTop + _vars._slideEl.clientHeight, //Bottom
						];
						break;
					case StyleSwiper.DIRECTION.BOTH:
						scrollBounds = [
							_vars._slideEl.scrollLeft, //Left
							_vars._slideEl.scrollTop, //Top
							_vars._slideEl.scrollLeft + _vars._slideEl.clientWidth, //Right
							_vars._slideEl.scrollTop + _vars._slideEl.clientHeight, //Bottom
						];
						break;
				}
			}
			return scrollBounds;
		},

		//This evaluates what is visible and adds classes
		evalVisibility:function(){
			if (_instance.debug){
				console.log("StyleSwiper::evalVisibility");
			}

			var dirtyEls = [];
			var visibleEls = [];
			var isFirstVisible = false;
			var isLastVisible = false;

			var hasPages = _vars._pages.length > 0;
			var slidesLen = _vars._slides.length;
			for (var i = 0; i < slidesLen; i++){
				var slide = _vars._slides[i];
				var page = hasPages ? _vars._pages[i] :null;
				var isVisible = _instance.isVisible(slide);

				if (isVisible){
					if (!slide.classList.contains(_instance.classVisible)){
						slide.classList.add(_instance.classVisible);
						dirtyEls.push({
							el:slide,
							isVisible:true
						});
					}
					visibleEls.push(slide);

					if (page){
						if (!page.classList.contains(_instance.classVisible)){
							page.classList.add(_instance.classVisible);
						}
					}
				} else {
					if (slide.classList.contains(_instance.classVisible)){
						slide.classList.remove(_instance.classVisible);
						dirtyEls.push({
							el:slide,
							isVisible:false
						});
					}
					if (page){
						if (page.classList.contains(_instance.classVisible)){
							page.classList.remove(_instance.classVisible);
						}
					}
				}

				if (i == 0){
					isFirstVisible = isVisible;
				}
				if (i == slidesLen - 1){
					isLastVisible = isVisible;
				}
			}

			//Events
			if (_instance.events){
				for (var i = 0; i < dirtyEls.length; i++){
					var dirtyEl = dirtyEls[i];
					dirtyEl.el.dispatchEvent(new CustomEvent(_instance.eventChangeVisible, {
						detail:{
							isVisible:dirtyEl.isVisible
						}
					}));
				}
			}

			//_btnPrevEl hidden?
			if (_vars._btnPrevEl){
				if (isFirstVisible){
					if (!_vars._btnPrevEl.classList.contains(_instance.classHidden)){
						_vars._btnPrevEl.classList.add(_instance.classHidden);
					}
				} else {
					if (_vars._btnPrevEl.classList.contains(_instance.classHidden)){
						_vars._btnPrevEl.classList.remove(_instance.classHidden);
					}
				}
			}

			//_btnNextEl hidden?
			if (_vars._btnNextEl){
				if (isLastVisible){
					if (!_vars._btnNextEl.classList.contains(_instance.classHidden)){
						_vars._btnNextEl.classList.add(_instance.classHidden);
					}
				} else {
					if (_vars._btnNextEl.classList.contains(_instance.classHidden)){
						_vars._btnNextEl.classList.remove(_instance.classHidden);
					}
				}
			}

			//_paginationEl hidden?
			if (_vars._paginationEl){
				if (visibleEls.length == slidesLen){
					if (!_vars._paginationEl.classList.contains(_instance.classHidden)){
						_vars._paginationEl.classList.add(_instance.classHidden);
					}
				} else {
					if (_vars._paginationEl.classList.contains(_instance.classHidden)){
						_vars._paginationEl.classList.remove(_instance.classHidden);
					}
				}
			}
		},

		//Active is closest distance between top/left of elBounds and scrollBounds
		//This evaluates what is active and adds classes
		evalActive:function(){
			var scrollBounds = _methods._getScrollBounds();

			var closestIndex = -1;
			var closestDist = -1;
			var slidesLen = _vars._slides.length;
			for (var i = 0; i < slidesLen; i++){
				var elBounds = _methods._getBounds(_vars._slides[i]);
				var diff = [
					Math.abs(scrollBounds[0] - elBounds[0]),
					Math.abs(scrollBounds[1] - elBounds[1])
				];
				var dist = Math.sqrt(Math.pow(diff[0], 2) + Math.pow(diff[1], 2));
				if (closestDist == -1 || dist < closestDist){
					closestDist = dist;
					closestIndex = i;
				}
			}

			//Classes + events
			var hasPages = _vars._pages.length > 0;
			for (var i = 0; i < slidesLen; i++){
				var slide = _vars._slides[i];
				var page = hasPages ? _vars._pages[i] :null;

				if (i == closestIndex){
					if (!slide.classList.contains(_instance.classActive)){
						slide.classList.add(_instance.classActive);
						if (_instance.events){
							slide.dispatchEvent(new CustomEvent(_instance.eventChangeActive, {
								detail:{
									isActive:true
								}
							}));
						}
					}
					if (page){
						if (!page.classList.contains(_instance.classActive)){
							page.classList.add(_instance.classActive);
						}
					}
				} else {
					if (slide.classList.contains(_instance.classActive)){
						slide.classList.remove(_instance.classActive);
						if (_instance.events){
							slide.dispatchEvent(new CustomEvent(_instance.eventChangeActive, {
								detail:{
									isActive:false
								}
							}));
						}
					}
					if (page){
						if (page.classList.contains(_instance.classActive)){
							page.classList.remove(_instance.classActive);
						}
					}
				}
			}

			if (_instance.debug){
				console.log("StyleSwiper::evalActive", closestIndex);
			}

			_vars._activeIndex = closestIndex;
		},

		previous:function(){
			_instance.goto(_vars._activeIndex - 1);
		},

		next:function(){
			_instance.goto(_vars._activeIndex + 1);
		},

		goto:function(index, noScroll){
			if (!_vars._slides.length){
				console.warn("Cannot goto slide due to no slides!");
				return;
			}
			index = Math.max(Math.min(index, _vars._slides.length - 1), 0);
			noScroll = noScroll === true;

			if (_instance.debug){
				console.log("StyleSwiper::goto", index);
			}
			_vars._activeIndex = index;

			var bounds = _methods._getBounds(_vars._slides[index]);
			if (_vars._slideEl.scrollLeft == bounds[0] && _vars._slideEl.scrollTop == bounds[1]){
				//Already there, re-evaluate
				_instance.evalVisibility();
				_instance.evalActive();
			} else {
				//Scroll
				if (!noScroll && typeof _vars._slideEl.scrollTo !== typeof undefined) {
					_vars._slideEl.scrollTo({
						left:bounds[0],
						top:bounds[1],
						behavior:_instance.scrollBehavior
					});
				} else {
					_vars._slideEl.scrollLeft = bounds[0];
					_vars._slideEl.scrollTop = bounds[1];
				}
			}
		},

		_handler_prev_click:function(){
			if (_instance.debug){
				console.log("StyleSwiper::_handler_prev_click");
			}
			_instance.previous();
		},

		_handler_next_click:function(){
			if (_instance.debug){
				console.log("StyleSwiper::_handler_next_click");
			}
			_instance.next();
		},

		_handler_page_click:function(evt){
			var pageNum = parseInt(evt.target.getAttribute(_instance.attributePageNum));
			if (_instance.debug){
				console.log("StyleSwiper::_handler_page_click", pageNum);
			}
			if (!isNaN(pageNum)){
				_instance.goto(pageNum);
			}
		}
	};

	_instance = {
		debug:_vars.debug,

		attributePageNum:_vars.attributePageNum,

		events:_vars.events,
		eventChangeVisible:_vars.eventChangeVisible,
		eventChangeActive:_vars.eventChangeActive,

		classSlides:_vars.classSlides,
		classBtnPrev:_vars.classBtnPrev,
		classBtnNext:_vars.classBtnNext,
		classPagination:_vars.classPagination,
		classPage:_vars.classPage,
		classVisible:_vars.classVisible,
		classActive:_vars.classActive,
		classHidden:_vars.classHidden,

		scrollDirection:_vars.scrollDirection,
		scrollBehavior:_vars.scrollBehavior,
		scrollDebounce:_vars.scrollDebounce,

		//Methods
		init:_methods.init,
		destroy:_methods.destroy,

		getSlides:_methods.getSlides,
		getVisible:_methods.getVisible,
		getActive:_methods.getActive,
		getActiveIndex:_methods.getActiveIndex,

		updateSlides:_methods.updateSlides,
		isVisible:_methods.isVisible,
		evalVisibility:_methods.evalVisibility,
		evalActive:_methods.evalActive,

		previous:_methods.previous,
		next:_methods.next,
		goto:_methods.goto
	};

	//Apply params
	var el = null;
	if (params){
		for (var param in params){
			_instance[param] = params[param];
		}
		el = params.el || null;
	}
	_instance.init(el);

	return _instance;
};

//Static
StyleSwiper.DEFAULT_ATTRIBUTE_PAGE_NUM = "data-page-num";

StyleSwiper.DEFAULT_EVENT_CHANGE_VISIBLE = "style-swiper-event-visible";
StyleSwiper.DEFAULT_EVENT_CHANGE_ACTIVE = "style-swiper-event-active";

StyleSwiper.DEFAULT_CLASS_SLIDES = "style-swiper-slides";
StyleSwiper.DEFAULT_CLASS_BTN_PREV = "style-swiper-btn-prev";
StyleSwiper.DEFAULT_CLASS_BTN_NEXT = "style-swiper-btn-next";
StyleSwiper.DEFAULT_CLASS_PAGINATION = "style-swiper-pagination";
StyleSwiper.DEFAULT_CLASS_PAGE = "style-swiper-page";
StyleSwiper.DEFAULT_CLASS_VISIBLE = "style-swiper-visible";
StyleSwiper.DEFAULT_CLASS_ACTIVE = "style-swiper-active";
StyleSwiper.DEFAULT_CLASS_HIDDEN = "style-swiper-hidden";

StyleSwiper.DIRECTION = {
	//TODO: Add "auto"
	HORIZONTAL:"horizontal",
	VERTICAL:"vertical",
	BOTH:"both",
};

//Export via window - change this if you want
window.StyleSwiper = StyleSwiper;