/**
 * iSlider
 * A simple, efficent mobile slider
 * @Author BEFE
 *
 * @param {Object}      opts                参数集
 * @param {Element}     opts.dom            外层元素        Outer wrapper
 * @param {Object}      opts.data           数据列表        Content data
 * Please refer to README                   请参考README
 * @class
 */

'use strict';

var iSlider = function (opts) {
    if (!opts.dom) {
        throw new Error('dom element can not be empty!');
    }

    if (!opts.data || !opts.data.length) {
        throw new Error('data must be an array and must have more than one element!');
    }

    this._opts = opts;
    this._setting();
    this._renderHTML();
    this._bindHandler();
};

// setting parameters for slider
iSlider.prototype._setting = function () {
    var opts = this._opts;

    // dom element wrapping content
    this.wrap = opts.dom;
    // your data
    this.data = opts.data;
    // default type
    this.type = opts.type || 'pic';
    // default slide direction
    this.isVertical = opts.isVertical || false;
    // Overspread mode
    this.isOverspread = opts.isOverspread || false;
    // Play time gap
    this.duration = opts.duration || 2000;
    // start from 0
    this.slideIndex = this.slideIndex || 0;

    this.axis = this.isVertical ? 'Y' : 'X';
    this.width = this.wrap.clientWidth;
    this.height = this.wrap.clientHeight;
    this.ratio = this.height / this.width;
    this.scale = opts.isVertical ? this.height : this.width;

    // Callback function when your finger is moving
    this.onslide = opts.onslide;
    // Callback function when your finger touch the screen
    this.onslidestart = opts.onslidestart;
    // Callback function when the finger move out of the screen
    this.onslideend = opts.onslideend;
    // Callback function when the finger move out of the screen
    this.onslidechange = opts.onslidechange;

    // looping logic adjust
    if (this.data.length < 2) {
        this.isLooping = false;
        this.isAutoPlay = false;
    } else {
        this.isLooping = opts.isLooping || false;
        this.isAutoplay = opts.isAutoplay || false;
    }

    // little trick set, when you chooce tear & vertical same time
    // iSlider overspread mode will be set true autometicly
    if (opts.animateType === 'card' && this.isVertical) {
        this.isOverspread = true;
    }

    // Autoplay mode
    if (this.isAutoplay) {
        this.play();
    }

    // debug mode
    this.log = opts.isDebug ? function(str) {window.console.log(str);} : function() {};
    // set Damping function
    this._setUpDamping();
    // stop autoplay when window blur
    this._setPlayWhenFocus();
    // set animate Function
    this._animateFunc = (opts.animateType in this._animateFuncs)
    ? this._animateFuncs[opts.animateType]
    : this._animateFuncs['default'];
};

// fixed bug for android device
iSlider.prototype._setPlayWhenFocus = function() {
    var self = this;
    window.addEventListener('focus', function() {
        self.isAutoplay && self.play();
    }, false);
    window.addEventListener('blur', function() {
        self.pause();
    }, false);
};

/**
 * animation parmas:
 *
 * @param {Element}      dom             图片的外层<li>容器       Img wrapper
 * @param {String}       axis            动画方向                animate direction
 * @param {Number}       scale           容器宽度                Outer wrapper
 * @param {Number}       i               <li>容器index          Img wrapper's index
 * @param {Number}       offset          滑动距离                move distance
 */
iSlider.prototype._animateFuncs = {

    'default': function (dom, axis, scale, i, offset) {
        dom.style.webkitTransform = 'translateZ(0) translate' + axis + '(' + (offset + scale * (i - 1)) + 'px)';
    },

    'rotate': function (dom, axis, scale, i, offset) {
        var rotateDirect = (axis === 'X') ? 'Y' : 'X';
        var absoluteOffset = Math.abs(offset);
        var bdColor = window.getComputedStyle(this.wrap.parentNode, null).backgroundColor;

        if (this.isVertical) {
            offset = -offset;
        }

        this.wrap.style.webkitPerspective = scale * 4;

        if (i === 1) {
            dom.style.zIndex = scale - absoluteOffset;
        } else {
            dom.style.zIndex = (offset > 0) ? (1 - i) * absoluteOffset : (i - 1) * absoluteOffset;
        }

        dom.style.cssText += '-webkit-backface-visibility:hidden; -webkit-transform-style:preserve-3d; '
            + 'background-color:' + bdColor + '; position:absolute;';
        dom.style.webkitTransform = 'rotate' + rotateDirect + '(' + 90 * (offset / scale + i - 1) + 'deg) translateZ('
                                    + (0.888 * scale / 2) + 'px) scale(0.888)';
    },

    'flip': function (dom, axis, scale, i, offset) {
        var rotateDirect = (axis === 'X') ? 'Y' : 'X';
        var bdColor = window.getComputedStyle(this.wrap.parentNode, null).backgroundColor;
        if (this.isVertical) {
            offset = -offset;
        }
        this.wrap.style.webkitPerspective = scale * 4;

        if (offset > 0) {
            dom.style.visibility = (i > 1) ? 'hidden' : 'visible';
        } else {
            dom.style.visibility = (i < 1) ? 'hidden' : 'visible';
        }

        dom.style.cssText += 'position:absolute; -webkit-backface-visibility:hidden; background-color:' + bdColor + ';';
        dom.style.webkitTransform = 'translateZ(' + (scale / 2) + 'px) rotate' + rotateDirect
                                    + '(' + 180 * (offset / scale + i - 1) + 'deg) scale(0.875)';
    },

    'depth': function (dom, axis, scale, i, offset) {
        var zoomScale = (4 - Math.abs(i - 1)) * 0.18;
        this.wrap.style.webkitPerspective = scale * 4;
        dom.style.zIndex = (i === 1) ? 100 : (offset > 0) ? (1 - i) : (i - 1);
        dom.style.webkitTransform = 'scale(' + zoomScale + ', ' + zoomScale + ') translateZ(0) translate'
                                    + axis + '(' + (offset + 1.3 * scale * (i - 1)) + 'px)';
    },

    'flow': function (dom, axis, scale, i, offset) {
        var absoluteOffset = Math.abs(offset);
        var rotateDirect = (axis === 'X') ? 'Y' : 'X';
        var directAmend = (axis === 'X') ? 1 : -1;
        var offsetRatio = Math.abs(offset / scale);

        this.wrap.style.webkitPerspective = scale * 4;

        if (i === 1) {
            dom.style.zIndex = scale - absoluteOffset;
        } else {
            dom.style.zIndex = (offset > 0) ? (1 - i) * absoluteOffset : (i - 1) * absoluteOffset;
        }

        dom.style.webkitTransform = 'scale(0.7, 0.7) translateZ(' + (offsetRatio * 150 - 150) * Math.abs(i - 1) + 'px)'
            + 'translate' + axis + '(' + (offset + scale * (i - 1)) + 'px)'
            + 'rotate' + rotateDirect + '(' + directAmend * (30 -  offsetRatio * 30) * (1 - i) + 'deg)';
    },

    'card': function (dom, axis, scale, i, offset) {
        var absoluteOffset = Math.abs(offset);

        if (i === 1) {
            dom.style.zIndex = scale - absoluteOffset;
            dom.cur = 1;
        } else {
            dom.style.zIndex = (offset > 0) ? (1 - i) * absoluteOffset * 1000 : (i - 1) * absoluteOffset * 1000;
        }

        if (dom.cur && dom.cur !== i) {
            setTimeout(function() {
                dom.cur = null;
            }, 300);
        }

        var zoomScale = (dom.cur) ? 1 - 0.2 * Math.abs(i - 1) - Math.abs(0.2 * offset / scale).toFixed(6) : 1;
        dom.style.webkitTransform = 'scale(' + zoomScale + ', ' + zoomScale + ') translateZ(0) translate' + axis
            + '(' + ((1 + Math.abs(i - 1) * 0.2) * offset + scale * (i - 1)) + 'px)';
    }
};

/**
 *  enable damping when slider meet the edge
 */
iSlider.prototype._setUpDamping = function () {
    var oneIn2 = this.scale >> 1;
    var oneIn4 = oneIn2 >> 1;
    var oneIn16 = oneIn4 >> 2;

    this._damping = function (distance) {
        var dis = Math.abs(distance);
        var result;

        if (dis < oneIn2) {
            result = dis >> 1;
        } else if (dis < oneIn2 + oneIn4) {
            result = oneIn4 + ((dis - oneIn2) >> 2);
        } else {
            result = oneIn4 + oneIn16 + ((dis - oneIn2 - oneIn4) >> 3);
        }

        return distance > 0 ? result : -result;
    };
};

/**
 *  render single item html by idx
 */
iSlider.prototype._renderItem = function (el, i) {
    var item;
    var html;
    var len = this.data.length;

    // get the right item of data
    if (!this.isLooping) {
        item = this.data[i] || {empty: true};
    } else {
        if (i < 0) {
            item = this.data[len + i];
        } else if (i > len - 1) {
            item = this.data[i - len];
        } else {
            item = this.data[i];
        }
    }

    if (item.empty) {
        el.innerHTML = '';
        el.style.background = '';
        return ;
    }

    if (this.type === 'pic') {
        if (!this.isOverspread) {
            html = item.height / item.width > this.ratio
            ? '<img height="' + this.height + '" src="' + item.content + '">'
            : '<img width="' + this.width + '" src="' + item.content + '">';
        } else {
            el.style.background = 'url(' + item.content + ') 50% 50% / cover no-repeat';
        }
    } 
    else if (this.type === 'dom') {
        html = item.content;
    }

    html && (el.innerHTML = html);
};

/**
 *  render list html
 */
iSlider.prototype._renderHTML = function () {
    this.outer && (this.outer.innerHTML = '');

    // initail ul element
    var outer = this.outer || document.createElement('ul');
    outer.style.cssText = 'height:' + this.height + 'px;width:' + this.width + 'px;';

    // storage li elements, only store 3 elements to reduce memory usage
    this.els = [];
    for (var i = 0; i < 3; i++) {
        var li = document.createElement('li');
        li.style.cssText = 'height:' + this.height + 'px;width:' + this.width + 'px;';
        this.els.push(li);

        // prepare style animation
        this._animateFunc(li, this.axis, this.scale, i, 0);
        if (this.isVertical && (this._opts.animateType === 'rotate' || this._opts.animateType === 'flip')) {
            this._renderItem(li, 1 - i + this.slideIndex);
        } else {
            this._renderItem(li, i - 1 + this.slideIndex);
        }
        outer.appendChild(li);
    }

    // append ul to div#canvas
    if (!this.outer) {
        this.outer = outer;
        this.wrap.appendChild(outer);
    }
};

/**
 *  slide logical, goto data index
 */
iSlider.prototype.slideTo = function (dataIndex) {
    var data = this.data;
    var els = this.els;
    var idx = dataIndex;
    var n = dataIndex - this.slideIndex;


    if (Math.abs(n) > 1) {
        var nextEls = n > 0 ? this.els[2] : this.els[0]
        this._renderItem(nextEls, idx);
    }

    // get right item of data
    if (data[idx]) {
        this.slideIndex = idx;
    } else {
        if (this.isLooping) {
            this.slideIndex = n > 0 ? 0 : data.length - 1;
        } else {
            this.slideIndex = this.slideIndex;
            n = 0;
        }
    }

    this.log('pic idx:' + this.slideIndex);

    // keep the right order of items
    var sEle;
    if (this.isVertical && (this._opts.animateType === 'rotate' || this._opts.animateType === 'flip')) {
        if (n > 0) {
            sEle = els.pop();
            els.unshift(sEle);
        } else if (n < 0) {
            sEle = els.shift();
            els.push(sEle);
        }
    } else {
        if (n > 0) {
            sEle = els.shift();
            els.push(sEle);
        } else if (n < 0) {
            sEle = els.pop();
            els.unshift(sEle);
        }
    }

    // slidechange should render new item
    // and change new item style to fit animation
    if (n !== 0) {
        if ( Math.abs(n) > 1) {
            this._renderItem(els[0], idx - 1);
            this._renderItem(els[2], idx + 1);
        } else if (Math.abs(n) === 1) {
            this._renderItem(sEle, idx + n);
        }
        sEle.style.webkitTransition = 'none';
        sEle.style.visibility = 'hidden';

        setTimeout(function() {
            sEle.style.visibility = 'visible';
        }, 200);

        this.onslidechange && this.onslidechange(this.slideIndex);
    } 

    // do the trick animation
    for (var i = 0; i < 3; i++) {
        if (els[i] !== sEle) {
            els[i].style.webkitTransition = 'all .3s ease';
        }
        this._animateFunc(els[i], this.axis, this.scale, i, 0);
    }

    // stop playing when meet the end of data
    if (this.isAutoplay && !this.isLooping && this.slideIndex === data.length - 1) {
        this.pause();
    }
};

/**
* bind all event handler
*/
iSlider.prototype._bindHandler = function() {
    var self = this;
    // judge mousemove start or end
    var isMoving = false;
    var outer = self.outer;
    // desktop event support
    var hasTouch = !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch);
    var startEvt = hasTouch ? 'touchstart' : 'mousedown';
    var moveEvt = hasTouch ? 'touchmove' : 'mousemove';
    var endEvt = hasTouch ? 'touchend' : 'mouseup';

    var startHandler = function(evt) {
        isMoving = true;

        self.pause();
        self.onslidestart && self.onslidestart();
        self.log('Event: beforeslide');

        self.startTime = new Date().getTime();
        self.startX = hasTouch ? evt.targetTouches[0].pageX : evt.pageX;
        self.startY = hasTouch ? evt.targetTouches[0].pageY : evt.pageY;
    };

    var moveHandler = function (evt) {
        if (isMoving) {
            evt.preventDefault();

            var len = self.data.length;
            var axis = self.axis;
            var currentPoint = hasTouch ? evt.targetTouches[0]['page' + axis] : evt['page' + axis];
            var offset = currentPoint - self['start' + axis];

            self.onslide && self.onslide(offset);
            self.log('Event: onslide');

            if (!self.isLooping) {
                if (offset > 0 && self.slideIndex === 0 || offset < 0 && self.slideIndex === len - 1) {
                    offset = self._damping(offset);
                }
            }

            for (var i = 0; i < 3; i++) {
                var item = self.els[i];
                item.style.webkitTransition = 'all 0s';
                self._animateFunc(item, axis, self.scale, i, offset);
            }

            self.offset = offset;
        }
    };

    var endHandler = function (evt) {
        isMoving = false;

        var metric = self.offset;
        var boundary = self.scale / 2;
        var endTime = new Date().getTime();

        // a quick slide time must under 300ms
        // a quick slide should also slide at least 14 px
        boundary = endTime - self.startTime > 300 ? boundary : 14;
        if (metric >= boundary) {
            self.slideTo(self.slideIndex - 1);
        } else if (metric < -boundary) {
            self.slideTo(self.slideIndex + 1);
        } else {
            self.slideTo(self.slideIndex);
        }

        self.offset = 0;
        self.isAutoplay && self.play();
        self.onslideend && self.onslideend(self.slideIndex);
        self.log('Event: afterslide');
    };

    var orientationchangeHandler = function (evt) {
        setTimeout(function() {
            self.reset();
            self.log('Event: orientationchange');
        },100);
    };

    outer.addEventListener(startEvt, startHandler);
    outer.addEventListener(moveEvt, moveHandler);
    outer.addEventListener(endEvt, endHandler);
    window.addEventListener('orientationchange', orientationchangeHandler);
};

iSlider.prototype.reset = function() {
    this.pause();
    this._setting();
    this._renderHTML();
    this.isAutoplay && this.play();
};

/**
* enable autoplay
*/
iSlider.prototype.play = function() {
    var self = this;
    var duration = this.duration;
    clearInterval(this.autoPlayTimer);
    this.autoPlayTimer = setInterval(function () {
        self.slideTo(self.slideIndex + 1);
    }, duration);
};

/**
* pause autoplay
*/
iSlider.prototype.pause = function() {
    clearInterval(this.autoPlayTimer);
};


/**
* plugin extend
*/
iSlider.prototype.extend = function(plugin, main) {
    if (!main) {
        main = iSlider.prototype;
    }
    Object.keys(plugin).forEach(function(property) {
        Object.defineProperty(main, property, Object.getOwnPropertyDescriptor(plugin, property));
    });
};
