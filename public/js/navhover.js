(() => {
  // <stdin>
  (function($) {
    $.fn.hoverIntent = function(handlerIn, handlerOut, selector) {
      var cfg = {
        interval: 100,
        sensitivity: 6,
        timeout: 0
      };
      if (typeof handlerIn === "object") {
        cfg = $.extend(cfg, handlerIn);
      } else if ($.isFunction(handlerOut)) {
        cfg = $.extend(cfg, { over: handlerIn, out: handlerOut, selector });
      } else {
        cfg = $.extend(cfg, { over: handlerIn, out: handlerIn, selector: handlerOut });
      }
      var cX, cY, pX, pY;
      var track = function(ev) {
        cX = ev.pageX;
        cY = ev.pageY;
      };
      var compare = function(ev, ob) {
        ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
        if (Math.sqrt((pX - cX) * (pX - cX) + (pY - cY) * (pY - cY)) < cfg.sensitivity) {
          $(ob).off("mousemove.hoverIntent", track);
          ob.hoverIntent_s = true;
          return cfg.over.apply(ob, [ev]);
        } else {
          pX = cX;
          pY = cY;
          ob.hoverIntent_t = setTimeout(function() {
            compare(ev, ob);
          }, cfg.interval);
        }
      };
      var delay = function(ev, ob) {
        ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
        ob.hoverIntent_s = false;
        return cfg.out.apply(ob, [ev]);
      };
      var handleHover = function(e) {
        var ev = $.extend({}, e);
        var ob = this;
        if (ob.hoverIntent_t) {
          ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
        }
        if (e.type === "mouseenter") {
          pX = ev.pageX;
          pY = ev.pageY;
          $(ob).on("mousemove.hoverIntent", track);
          if (!ob.hoverIntent_s) {
            ob.hoverIntent_t = setTimeout(function() {
              compare(ev, ob);
            }, cfg.interval);
          }
        } else {
          $(ob).off("mousemove.hoverIntent", track);
          if (ob.hoverIntent_s) {
            ob.hoverIntent_t = setTimeout(function() {
              delay(ev, ob);
            }, cfg.timeout);
          }
        }
      };
      return this.on({ "mouseenter.hoverIntent": handleHover, "mouseleave.hoverIntent": handleHover }, cfg.selector);
    };
  })(jQuery);
  (function($) {
    "use strict";
    var methods = function() {
      var c = {
        bcClass: "sf-breadcrumb",
        menuClass: "sf-js-enabled",
        anchorClass: "sf-with-ul",
        menuArrowClass: "sf-arrows"
      }, ios = function() {
        var ios2 = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (ios2) {
          $(window).load(function() {
            $("body").children().on("click", $.noop);
          });
        }
        return ios2;
      }(), wp7 = function() {
        var style = document.documentElement.style;
        return "behavior" in style && "fill" in style && /iemobile/i.test(navigator.userAgent);
      }(), toggleMenuClasses = function($menu, o) {
        var classes = c.menuClass;
        if (o.cssArrows) {
          classes += " " + c.menuArrowClass;
        }
        $menu.toggleClass(classes);
      }, setPathToCurrent = function($menu, o) {
        return $menu.find("li." + o.pathClass).slice(0, o.pathLevels).addClass(o.hoverClass + " " + c.bcClass).filter(function() {
          return $(this).children(o.popUpSelector).hide().show().length;
        }).removeClass(o.pathClass);
      }, toggleAnchorClass = function($li) {
        $li.children("a").toggleClass(c.anchorClass);
      }, toggleTouchAction = function($menu) {
        var touchAction = $menu.css("ms-touch-action");
        touchAction = touchAction === "pan-y" ? "auto" : "pan-y";
        $menu.css("ms-touch-action", touchAction);
      }, applyHandlers = function($menu, o) {
        var targets = "li:has(" + o.popUpSelector + ")";
        if ($.fn.hoverIntent && !o.disableHI) {
          $menu.hoverIntent(over, out, targets);
        } else {
          $menu.on("mouseenter.superfish", targets, over).on("mouseleave.superfish", targets, out);
        }
        var touchevent = "MSPointerDown.superfish";
        if (!ios) {
          touchevent += " touchend.superfish";
        }
        if (wp7) {
          touchevent += " mousedown.superfish";
        }
        $menu.on("focusin.superfish", "li", over).on("focusout.superfish", "li", out).on(touchevent, "a", o, touchHandler);
      }, touchHandler = function(e) {
        var $this = $(this), $ul = $this.siblings(e.data.popUpSelector);
        if ($ul.length > 0 && $ul.is(":hidden")) {
          $this.one("click.superfish", false);
          if (e.type === "MSPointerDown") {
            $this.trigger("focus");
          } else {
            $.proxy(over, $this.parent("li"))();
          }
        }
      }, over = function() {
        var $this = $(this), o = getOptions($this);
        clearTimeout(o.sfTimer);
        $this.siblings().superfish("hide").end().superfish("show");
      }, out = function() {
        var $this = $(this), o = getOptions($this);
        if (ios) {
          $.proxy(close, $this, o)();
        } else {
          clearTimeout(o.sfTimer);
          o.sfTimer = setTimeout($.proxy(close, $this, o), o.delay);
        }
      }, close = function(o) {
        o.retainPath = $.inArray(this[0], o.$path) > -1;
        this.superfish("hide");
        if (!this.parents("." + o.hoverClass).length) {
          o.onIdle.call(getMenu(this));
          if (o.$path.length) {
            $.proxy(over, o.$path)();
          }
        }
      }, getMenu = function($el) {
        return $el.closest("." + c.menuClass);
      }, getOptions = function($el) {
        return getMenu($el).data("sf-options");
      };
      return {
        // public methods
        hide: function(instant) {
          if (this.length) {
            var $this = this, o = getOptions($this);
            if (!o) {
              return this;
            }
            var not = o.retainPath === true ? o.$path : "", $ul = $this.find("li." + o.hoverClass).add(this).not(not).removeClass(o.hoverClass).children(o.popUpSelector), speed = o.speedOut;
            if (instant) {
              $ul.show();
              speed = 0;
            }
            o.retainPath = false;
            o.onBeforeHide.call($ul);
            $ul.stop(true, true).animate(o.animationOut, speed, function() {
              var $this2 = $(this);
              o.onHide.call($this2);
            });
          }
          return this;
        },
        show: function() {
          var o = getOptions(this);
          if (!o) {
            return this;
          }
          var $this = this.addClass(o.hoverClass), $ul = $this.children(o.popUpSelector);
          o.onBeforeShow.call($ul);
          $ul.stop(true, true).animate(o.animation, o.speed, function() {
            o.onShow.call($ul);
          });
          return this;
        },
        destroy: function() {
          return this.each(function() {
            var $this = $(this), o = $this.data("sf-options"), $hasPopUp;
            if (!o) {
              return false;
            }
            $hasPopUp = $this.find(o.popUpSelector).parent("li");
            clearTimeout(o.sfTimer);
            toggleMenuClasses($this, o);
            toggleAnchorClass($hasPopUp);
            toggleTouchAction($this);
            $this.off(".superfish").off(".hoverIntent");
            $hasPopUp.children(o.popUpSelector).attr("style", function(i, style) {
              return style.replace(/display[^;]+;?/g, "");
            });
            o.$path.removeClass(o.hoverClass + " " + c.bcClass).addClass(o.pathClass);
            $this.find("." + o.hoverClass).removeClass(o.hoverClass);
            o.onDestroy.call($this);
            $this.removeData("sf-options");
          });
        },
        init: function(op) {
          return this.each(function() {
            var $this = $(this);
            if ($this.data("sf-options")) {
              return false;
            }
            var o = $.extend({}, $.fn.superfish.defaults, op), $hasPopUp = $this.find(o.popUpSelector).parent("li");
            o.$path = setPathToCurrent($this, o);
            $this.data("sf-options", o);
            toggleMenuClasses($this, o);
            toggleAnchorClass($hasPopUp);
            toggleTouchAction($this);
            applyHandlers($this, o);
            $hasPopUp.not("." + c.bcClass).superfish("hide", true);
            o.onInit.call(this);
          });
        }
      };
    }();
    $.fn.superfish = function(method, args) {
      if (methods[method]) {
        return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
      } else if (typeof method === "object" || !method) {
        return methods.init.apply(this, arguments);
      } else {
        return $.error("Method " + method + " does not exist on jQuery.fn.superfish");
      }
    };
    $.fn.superfish.defaults = {
      popUpSelector: "ul,.sf-mega",
      // within menu context
      hoverClass: "sfHover",
      pathClass: "overrideThisToUse",
      pathLevels: 1,
      delay: 800,
      animation: { opacity: "show" },
      animationOut: { opacity: "hide" },
      speed: "normal",
      speedOut: "fast",
      cssArrows: true,
      disableHI: false,
      onInit: $.noop,
      onBeforeShow: $.noop,
      onShow: $.noop,
      onBeforeHide: $.noop,
      onHide: $.noop,
      onIdle: $.noop,
      onDestroy: $.noop
    };
    $.fn.extend({
      hideSuperfishUl: methods.hide,
      showSuperfishUl: methods.show
    });
  })(jQuery);
  if (jQuery("div.nav__submenu").css("position") == "absolute") {
    jQuery(document).ready(function() {
      jQuery("ul.nav__menu").superfish({
        popUpSelector: "div.nav__submenu",
        delay: 400,
        speed: "fast",
        dropShadows: false,
        cssArrows: false
      });
    });
  }
})();
/*!
 * hoverIntent v1.8.0 // 2014.06.29 // jQuery v1.9.1+
 * http://cherne.net/brian/resources/jquery.hoverIntent.html
 *
 * You may use hoverIntent under the terms of the MIT license. Basically that
 * means you are free to use hoverIntent as long as this header is left intact.
 * Copyright 2007, 2014 Brian Cherne
 */
