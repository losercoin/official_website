/*
* Resizer v1.0.2 Copyright (c) 2018 AJ Savino
* https://github.com/koga73/Resizer
* MIT License
*/
window.Resizer = function Resizer(params){
	var _instance = null;

	var _vars = {
		callbackDelay:300,      //Time in ms to wait before calling onResize

		_lastOrientation:window.orientation,
		_timeout:0
	};

	var _methods = {
		init:function(){
			if (window.addEventListener){
				window.addEventListener("resize", _methods._handler_resize, false);
				window.addEventListener("orientationchange", _methods._handler_resize, false);
			} else if (window.attachEvent){
				window.attachEvent("onresize", _methods._handler_resize);
				window.attachEvent("onorientationchange", _methods._handler_resize);
			}
		},

		destroy:function(){
			var timeout = _vars._timeout;
			if (timeout){
				clearTimeout(timeout);
				_vars._timeout = 0;
			}
			_instance.onResize = null;

			if (window.removeEventListener){
				window.removeEventListener("resize", _methods._handler_resize);
				window.removeEventListener("orientationchange", _methods._handler_resize);
			} else if (window.detachEvent){
				window.detachEvent("onresize", _methods._handler_resize);
				window.detachEvent("onorientationchange", _methods._handler_resize);
			}
		},

		getWidth:function(){
			return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
		},

		getHeight:function(){
			return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
		},

		_handler_resize:function(){
			if ("onorientationchange" in window){
				var orientation = window.orientation;
				if (orientation == _vars._lastOrientation){
					return;
				}
				_vars._lastOrientation = orientation;
			}
			if (_vars._timeout){
				clearTimeout(_vars._timeout);
			}
			_vars._timeout = setTimeout(_methods._handler_timeout, _instance.callbackDelay);
		},

		_handler_timeout:function(){
			clearTimeout(_vars._timeout);
			_vars._timeout = 0;
			_instance.onResize(_instance.getWidth(), _instance.getHeight());
		}
	};

	_instance = {
		callbackDelay:_vars.callbackDelay,

		init:_methods.init,
		destroy:_methods.destroy,
		getWidth:_methods.getWidth,
		getHeight:_methods.getHeight,
		onResize:null
	};
	for (var param in params){
		_instance[param] = params[param];
	}
	_instance.init();
	return _instance;
};