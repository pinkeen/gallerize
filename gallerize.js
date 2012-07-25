/***************************************************************************
 *                                                                         *
 *  Gallerize - A jQuery Fullscreen Gallery Plugin                         *
 *  2012 (c) Filip Sobalski <pinkeen@gmail.com>                            *
 *                                                                         *
 *  Permission is hereby granted, free of charge, to any person obtaining  *
 *  a copy of this software and associated documentation files (the        *
 *  "Software"), to deal in the Software without restriction, including    *
 *  without limitation the rights to use, copy, modify, merge, publish,    *
 *  distribute, sublicense, and/or sell copies of the Software, and to     *
 *  permit persons to whom the Software is furnished to do so, subject to  *
 *  the following conditions:                                              *
 *                                                                         *
 *  The above copyright notice and this permission notice shall be         *
 *  included in all copies or substantial portions of the Software.        *
 *                                                                         *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,        *
 *  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF     *
 *  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND                  *
 *  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE *
 *  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION *
 *  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION  *
 *  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.        *
 *                                                                         *
 ***************************************************************************/

(function($)
{
    /* Picture class */

    function Picture(src, container, settings)
    {
        this.src = src;
        this.loaded = false;
        this.spinner = $('<div/>', {'class' : 'spinner'});
        this.fitScreen = settings.fitScreen;
        this.visible = false;
        this.container = container;
        this.container.append(this.spinner);
        this.fadeDuration = settings.fadeDuration;
    }

    Picture.prototype.load = function()
    {
        if(this.loaded)
            return;

        this.image = $('<img/>', {'class' : 'picture'});
        this.image.load($.proxy(this.onLoaded, this));
        this.image.attr('src', this.src); // Do this after .load() to fix IE caching issues
        //this.image.load($.proxy(function() {setTimeout($.proxy(this.onLoaded,this), 300);}, this));
    };

    Picture.prototype.onLoaded = function()
    {
        this.loaded = true;
        this.spinner.replaceWith(this.image);

        if(this.visible)
        {
            this.show();
            this.resize();
        }
    };

    Picture.prototype.setSize = function(fitScreen)
    {
        this.fitScreen = fitScreen;

        if(!loaded)
            return;

        this.resize();
    };

    Picture.prototype.resize = function(fitScreen)
    {
        if(!this.loaded)
            return;

        var containerWidth = this.container.width();
        var containerHeight = this.container.height();

        if(!fitScreen)
            this.image.css('width', 'auto').css('height', 'auto');

        var imageWidth = this.image.width();
        var imageHeight = this.image.height();        
        
        if(this.fitScreen || imageHeight > containerHeight || imageWidth > containerWidth)
        {
            var containerRatio = containerWidth / containerHeight;
            var imageRatio = imageWidth / imageHeight;

            if(imageRatio > containerRatio)
            {
                this.image.css('width', '100%');
                this.image.css('top', (containerHeight - this.image.height()) / 2.0 + 'px').css('left', '0');
            }
            else
            {
                this.image.css('height', '100%');
                this.image.css('top', '0').css('left', (containerWidth - this.image.width()) / 2.0 + 'px');
            }
        }
        else if(!this.fitScreen)
        {
            this.image.css('top', (containerHeight - imageHeight) / 2.0 + 'px')
            this.image.css('left', (containerWidth - imageWidth) / 2.0 + 'px');
        }
    };

    Picture.prototype.show = function(instant)
    {
        instant = typeof instant == 'undefined' ? false : instant;
        
        if(this.loaded)
        {
            if(instant)
                this.image.show();
            else
                this.image.fadeIn(this.fadeDuration);
            this.resize();
        }
        else
        {
            this.spinner.show();
        }

        this.visible = true;
    };

    Picture.prototype.hide = function(instant)
    {
        instant = typeof instant == 'undefined' ? false : instant;
        
        if(this.loaded)
        {
            if(instant)
                this.image.hide();
            else
                this.image.fadeOut(this.fadeDuration);
        }
        else
        {
            this.spinner.hide();
        }

        this.visible = false;
    };
    
    /* Gallerize class */
    
    function Gallerize(container, settings)
    {
        this.settings = $.extend(true, {
            fitScreen : true,
            imageFadeDuration: 200,
            wrap: true,
            fullscreen: true,
            showCounter: true,
            showInfo: true,
            showBar: true,
            barFadeDuration: 200,
            barHideTimeout: 1000
        }, settings);

        this.index = null;
        this.pictures = new Array();
        this.container = container;
        this.container.data('gallerize', this);
        this.open = false;
        this.fitScreen = this.settings.fitScreen;
        this.screen = $('<div>', {'class' : 'gallerize'}).appendTo($('body'));

        var self = this;
        var elements = container.find('a > img');

        if(elements.length == 0)
            $.error('[jQuery.gallerize] No pictures found.');
        
        elements.each(function() {
            var img = $(this);
            var a = img.parent();

            var picture = new Picture(a.attr('href'), self.screen, self.settings);

            picture.thumbSrc = img.attr('src');
            picture.title = a.attr('title');
            picture.description = img.attr('alt');

            var index = self.pictures.push(picture) - 1;

            a.data('gallerize', {
                gallerize: self,
                index: index
            });
           
            a.click(function(event) {
                event.preventDefault();
                var data = $(this).data('gallerize');
                $.proxy(data.gallerize.show, data.gallerize)(data.index);
            });
        });

        if(this.settings.showCounter)
            this.counter = $('<div/>', {'class' : 'counter box'}).appendTo(this.screen);

        if(this.settings.showInfo)
            this.info = $('<div/>', {'class' : 'info box'}).appendTo(this.screen);

        if(this.settings.showBar)
            this.createBar();
    };

    Gallerize.prototype.createBar = function()
    {
        var wrapper = $('<div/>', {'class' : 'bar-wrapper'}).appendTo(this.screen);
        this.bar = $('<div/>', {'class' : 'bar box'}).appendTo(wrapper);
        var padding = $('<div/>', {'class' : 'padding'}).appendTo(this.bar);
        this.thumbs = $('<div/>', {'class' : 'thumbs'}).appendTo(padding);
        this.scroller = $('<div/>', {'class' : 'scroller'}).appendTo(this.thumbs);
        var inner = $('<div/>').appendTo(this.scroller).css('float', 'left');

        var width = 0;

        for(index in this.pictures)
        {
            var picture = this.pictures[index];
            
            picture.thumb = $('<div/>', {'class' : 'thumb'}).append(
                $('<img/>', {'src' : picture.thumbSrc}),
                $('<div/>', {'class' : 'overlay'})
            ).appendTo(inner);

            picture.thumb.click({ index: index }, $.proxy(function(event) {
                this.switchPicture(parseInt(event.data.index));
            }, this));
        }
        
       
        this.thumbs.mousemove({thumbs: this.thumbs, inner: inner, scroller: this.scroller}, function(event) {
            var tw = event.data.thumbs.width();
            var iw = event.data.inner.width();

            if(iw <= tw)
                return;
            
            var x = (event.clientX / tw) * (iw - tw);
            event.data.scroller.css('left', -x + 'px');
        });

        wrapper.mouseover({bar : this.bar, duration: this.settings.barFadeDuration}, function(event) {
            event.data.bar.fadeIn(event.data.duration);
        });

        wrapper.mouseleave({bar : this.bar, duration: this.settings.barFadeDuration, timeout: this.settings.barHideTimeout}, function(event) {
            setTimeout(function() {
                event.data.bar.fadeOut(event.data.duration);
            }, event.data.timeout);
        });
        
        
    };
    
    Gallerize.prototype.show = function(index)
    {
        if(this.open)
            return this.switchPicture(index);
            
        this.open = true;
        $(document).bind('keyup.gallerize', $.proxy(this.onKeyUp, this));
        $(window).bind('resize.gallerize', $.proxy(this.onResize, this));
        this.screen.show();

        if(typeof index == 'undefined' && this.index === null)
            this.switchPicture(0, true);
        else
            this.switchPicture(index, true);

        if(this.settings.fullscreen)
            this.enableFullScreen();
    };

    Gallerize.prototype.switchPicture = function(index, instant)
    {
        if(typeof index == 'undefined')
            return;

        if(index === this.index)
            return;

        var oldPicture = this.index === null ? null : this.pictures[this.index];
        var picture = this.pictures[index];

        if(this.settings.showBar)
        {
            picture.thumb.find('.overlay').toggleClass('selected');

            var pos = this.scroller.position().left;
            var startpos = picture.thumb.position().left;
            var endpos = startpos + picture.thumb.width();
            var width = this.thumbs.width();
            
            if((endpos + pos) > width)
                pos = width - endpos;

            if((startpos + pos) < 0)
                pos = -startpos;

            this.scroller.animate({'left': pos + 'px'}, this.settings.imageFadeDuration);
                
            
            if(oldPicture !== null)
                oldPicture.thumb.find('.overlay').toggleClass('selected');
        }

        this.index = index;
        
        picture.load();
        this.pictures[this.getNextIndex()].load();
        this.pictures[this.getPreviousIndex()].load();
        
        if(oldPicture !== null)
            oldPicture.hide(instant);

        picture.show(instant);

        if(this.settings.showCounter)
            this.counter.html((this.index + 1) + ' / ' + this.pictures.length);

        if(this.settings.showInfo)
        {
            if(picture.description || picture.title)
            {
                this.info.html('');
                
                if(picture.title)
                    $('<div/>', {'class' : 'title'}).html(picture.title).appendTo(this.info);

                if(picture.description)
                    $('<div/>', {'class' : 'description'}).html(picture.description).appendTo(this.info);

                if(!this.info.is(':visible'))
                {
                    this.info.fadeIn(this.settings.fadeDuration);
                }
            }
            else if(this.info.is(':visible'))
            {
                this.info.fadeOut(this.settings.fadeDuration);
            }
        }
    };
    
    Gallerize.prototype.close = function()
    {
        if(!this.open)
            return;

        this.open = false;
        
        $(document).unbind('keyup.gallerize');
        $(window).unbind('resize.gallerize');

        this.screen.hide();

        if(this.settings.fullscreen)
            this.disableFullScreen();
    };

    Gallerize.prototype.getNextIndex = function()
    {
        index = this.index + 1;
        
        if(index == this.pictures.length)
        {
            if(!this.settings.wrap)
                return this.index;

            return 0;
        }

        return index;
    };

    Gallerize.prototype.getPreviousIndex = function()
    {
        index = this.index - 1;

        if(index < 0)
        {
            if(!this.settings.wrap)
                return this.index;

            return this.pictures.length - 1;
        }

        return index;
    };

    Gallerize.prototype.next = function() { this.switchPicture(this.getNextIndex()); }
    Gallerize.prototype.previous = function() { this.switchPicture(this.getPreviousIndex()); }

    Gallerize.prototype.onResize = function()
    {
        if(this.index === null)
            return;

        this.pictures[this.index].resize();
    };
 
    Gallerize.prototype.onKeyUp = function(event)
    {
        if(event.which == 27)
        {
            event.preventDefault();
            this.close();
        }

        if(event.which == 37 || event.which == 8)
        {
            event.preventDefault();
            this.previous();
        }

        if(event.which == 39 || event.which == 32)
        {
            event.preventDefault();
            this.next();
        }
    };

    Gallerize.prototype.enableFullScreen = function()
    {
        var screen = this.screen.get(0);
        
        if(typeof screen.requestFullScreen != 'undefined')
        {
            screen.requestFullScreen();
        }
        else if(typeof screen.webkitRequestFullScreen != 'undefined')
        {
            screen.webkitRequestFullScreen();
        }
        else if(typeof screen.mozRequestFullScreen != 'undefined')
        {
            screen.mozRequestFullScreen();
        }
    };

    Gallerize.prototype.disableFullScreen = function()
    {

        if(typeof document.cancelFullScreen != 'undefined')
        {
            document.cancelFullScreen();
        }
        else if(typeof document.webkitCancelFullScreen != 'undefined')
        {
            document.webkitCancelFullScreen();
        }
        else if(typeof document.mozCancelFullScreen != 'undefined')
        {
            document.mozCancelFullScreen();
        }
    };
    

    /* jQuery boilerplate */

    function init(settings)
    {
        return this.each(function() {
            var container = $(this);
            container.data('gallerize', new Gallerize(container, settings));
        });
    }

    $.fn.gallerize = function(method)
    {
        if(this.length == 0)
            return this;
        
        if(typeof method === 'object' || !method)
            return init.apply(this, arguments);

        switch(method)
        {
            case 'show':
                if(this.length != 1)
                    $.error('[jQuery.gallerize] You cannot show multiple galleries at once!');

                var gallerize = $(this[0]).data('gallerize');

                if(typeof gallerize == 'undefined')
                    $.error('[jQuery.gallerize] Gallerize has not been initialized on this element!');

                return gallerize.show.apply(gallerize, Array.prototype.slice.call(arguments, 1));
                
            default:
                $.error('[jQuery.gallerize] Method ' + method + ' does not exist.');
        }
    };

})(jQuery);