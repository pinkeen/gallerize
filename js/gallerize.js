/*!
 *   Gallerize - A jQuery Fullscreen Gallery Plugin                         
 *   2012 (c) Filip Sobalski <pinkeen@gmail.com>                            
 *                                                                       
 *   Permission is hereby granted, free of charge, to any person obtaining  
 *   a copy of this software and associated documentation files (the        
 *   "Software"), to deal in the Software without restriction, including    
 *   without limitation the rights to use, copy, modify, merge, publish,    
 *   distribute, sublicense, and/or sell copies of the Software, and to     
 *   permit persons to whom the Software is furnished to do so, subject to  
 *   the following conditions:                                              
 *                                                                        
 *   The above copyright notice and this permission notice shall be         
 *   included in all copies or substantial portions of the Software.        
 *                                                                        
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,        
 *   EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF     
 *   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND                  
 *   NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
 *   LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION 
 *   OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION  
 *   WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.        
 */
(function($)
{
    "use strict";
 
    /*** Picture class ***/

    function Picture(src, container, settings) {
        this.src = src;
        this.loaded = false;
        this.spinner = $(settings.spinner);
        this.fitScreen = settings.fitScreen;
        this.visible = false;
        this.container = container;
        this.container.append(this.spinner);
        this.fadeDuration = settings.imageFadeDuration;
    }

    Picture.prototype.load = function() {
        if(this.loaded) {
            return;
        }

        this.image = $('<img/>', {'class' : 'picture'});
        this.image.load($.proxy(this.onLoaded, this));
        this.container.append(this.image);
        /* Do this after .load() to fix IE caching issues. */
        this.image.attr('src', this.src);
    };

    Picture.prototype.onLoaded = function() {
        if(this.loaded) {
            return;
        }        
        
        this.loaded = true;
        this.spinner.replaceWith(this.image);

        if(this.visible) {
            this.show();
            this.resize();
        }
    };

    Picture.prototype.setSize = function(fitScreen) {
        this.fitScreen = fitScreen;

        if(!this.loaded) {
            return;
        }

        this.resize();
    };

    Picture.prototype.resize = function(fitScreen) {
        if(!this.loaded) {
            return;
        }

        if(!fitScreen) {
            this.image.css('width', 'auto').css('height', 'auto');
        }
        
        var containerWidth = this.container.width(),
            containerHeight = this.container.height(),
            imageWidth = this.image.width(),
            imageHeight = this.image.height();
        
        if(this.fitScreen || imageHeight > containerHeight || imageWidth > containerWidth) {
            var containerRatio = containerWidth / containerHeight,
                imageRatio = imageWidth / imageHeight;

            if(imageRatio > containerRatio) {
                this.image.css('width', '100%')
                          .css('top', (containerHeight - this.image.height()) / 2.0 + 'px').css('left', '0');
            } else {
                this.image.css('height', '100%')
                          .css('top', '0').css('left', (containerWidth - this.image.width()) / 2.0 + 'px');
            }
        }
        else if(!this.fitScreen) {
            this.image.css('top', (containerHeight - imageHeight) / 2.0 + 'px')
                      .css('left', (containerWidth - imageWidth) / 2.0 + 'px');
        }
    };

    Picture.prototype.show = function(instant) {
        instant = typeof instant == 'undefined' ? false : instant;
        
        if(this.loaded) {
            if(instant) {
                this.image.show();
            } else {
                this.image.fadeIn(this.fadeDuration, 'linear');
            }
            this.resize();
        }
        else {
            this.spinner.show();
        }

        this.visible = true;
    };

    Picture.prototype.hide = function(instant) {
        instant = typeof instant == 'undefined' ? false : instant;
        
        if(this.loaded) {
            if(instant) {
                this.image.hide();
            } else {
                this.image.fadeOut(this.fadeDuration, 'linear');
            }
        } else {
            this.spinner.hide();
        }

        this.visible = false;
    };
    
    /*** Gallerize class ****/
    
    function Gallerize(container, settings) {
        this.settings = $.extend(true, {
            fitScreen : true,
            wrap: true,
            fullscreen: false,
            preloadAll: false,
            showCounter: true,
            showInfo: true,
            showThumbs: true,
            showResizeButton: true,
            imageFadeDuration: 0,            
            thumbsAlwaysVisible: false,
            thumbsFadeDuration: 200,
            thumbsHideTimeout: 500,
            arrowsFadeDuration: 300,
            thumbSlideDuration: 300,
            extension: null,
            title: null,
            spinner: '<div class="spinner"></div>'
        }, settings);

        this.index = null;
        this.pictures = [];
        this.container = container;
        this.container.data('gallerize', this);
        this.open = false;
        this.fitScreen = this.settings.fitScreen;
        this.screen = $('<div/>', {'class' : 'gallerize'}).appendTo($('body'));
        this.details = $('<div/>', {'class' : 'details'}).appendTo(this.screen);
        
        if(this.container.attr('title'))
        {
            this.settings.title = this.container.attr('title');
        }

        if(this.settings.title !== null)
        {
            $('<div/>', {'class' : 'title box'}).html(this.settings.title).appendTo(this.details);
        }

        var self = this,
            elements = container.find('a > img');

        if(elements.length == 0) {
            $.error('[jQuery.gallerize] No pictures found.');
        }
        
        elements.each(function() {
            var img = $(this),
                a = img.parent(),
                picture = new Picture(a.attr('href'), self.screen, self.settings);

            picture.thumbSrc = img.attr('src');
            picture.title = a.attr('title');
            picture.description = img.attr('alt');

            if(self.settings.preloadAll) {
                picture.load();
            }

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

        if(this.settings.showCounter) {
            this.counter = $('<div/>', {'class' : 'counter box'}).appendTo(this.details);
        }

        if(this.settings.showInfo) {
            this.info = $('<div/>', {'class' : 'info box'}).appendTo(this.screen);
        }

        if(this.settings.showThumbs) {
            this.createThumbs();
        }

        this.buttons = $('<div/>', {'class' : 'buttons'}).appendTo(this.screen);
        
        this.buttonClose = $('<div/>', {'class' : 'btn btn-close'}).appendTo(this.buttons).click($.proxy(function() {
            this.close();
        }, this));

        if(this.settings.showResizeButton) {
            this.buttonRealSize = $('<div/>', {'class' : 'btn btn-real-size'}).appendTo(this.buttons).click($.proxy(function() {
                    this.buttonRealSize.hide();
                    this.buttonFitScreen.show();
                    this.setSize(false);
            }, this));

            this.buttonFitScreen = $('<div/>', {'class' : 'btn btn-fit-screen'}).appendTo(this.buttons).click($.proxy(function() {
                    this.buttonRealSize.show();
                    this.buttonFitScreen.hide();
                    this.setSize(true);
            }, this));

            if(this.fitScreen) {
                this.buttonFitScreen.hide();
            } else {
                this.buttonRealSize.hide();
            }
        }

        var arrowsFadeDuration = this.settings.arrowsFadeDuration,
            fadeToggle = function() {
            $(this).find('.arrow').stop().fadeToggle(arrowsFadeDuration);
        };
        
        $('<div/>', {'class' : 'arrow-area arrow-area-left'})
            .append($('<div/>', {'class' : 'arrow arrow-left'}))
            .appendTo(this.screen)
            .click($.proxy(this.previous, this))
            .hover(fadeToggle, fadeToggle);
            
        $('<div/>', {'class' : 'arrow-area arrow-area-right'})
            .append($('<div/>', {'class' : 'arrow arrow-right'}))
            .appendTo(this.screen)
            .click($.proxy(this.next, this))
            .hover(fadeToggle, fadeToggle);

        if(this.settings.extension !== null)
        {
            if(typeof this.settings.extension !== 'function')
            {
                $.error('[jQuery.gallerize] The extension should be a function!');
            }
            
            this.settings.extension(this, screen);
        }
    }

    Gallerize.prototype.setSize = function(fitScreen) {
        var i;
        this.fitScreen = fitScreen;
        
        for(i = 0; i < this.pictures.length; i++) {
            this.pictures[i].setSize(fitScreen);
        }
    };

    Gallerize.prototype.createThumbs = function() {
        this.thumbsWrapper = $('<div/>', {'class' : 'thumbs-wrapper'}).appendTo(this.screen);
        this.thumbs = $('<div/>', {'class' : 'thumbs'}).appendTo(this.thumbsWrapper);
        this.scroller = $('<div/>', {'class' : 'scroller'}).appendTo(this.thumbs);
        this.thumbsInner = $('<div/>').appendTo(this.scroller).css('float', 'left');

        var index,
            thumbClick = $.proxy(function(event) {
                this.switchPicture(parseInt(event.data.index, 10));
            }, this);

        for(index = 0; index < this.pictures.length; index++) {
            var picture = this.pictures[index];
            
            picture.thumb = $('<div/>', {'class' : 'thumb'}).append(
                $('<img/>', {'src' : picture.thumbSrc}),
                $('<div/>', {'class' : 'overlay'})
            ).appendTo(this.thumbsInner);

            picture.thumb.click({ index: index }, thumbClick);
        }
        
       
        this.thumbs.mousemove({thumbs: this.thumbs, inner: this.thumbsInner, scroller: this.scroller}, function(event) {
            if(event.data.scroller.is(':animated'))
                return;
            var tw = event.data.thumbs.width(),
                iw = event.data.inner.width(),
                x;

            if(iw <= tw) {
                return;
            }
            
            x = (event.clientX / tw) * (iw - tw);
            event.data.scroller.css('left', -x + 'px');
        });

        if(this.settings.thumbsAlwaysVisible) {
            this.thumbs.show();
        } else {
            this.thumbs.hide();
            this.thumbs.data('gallerize', {hover: false});
            
            this.thumbsWrapper.mouseover({bar : this.thumbs, duration: this.settings.thumbsFadeDuration}, function(event) {
                var data = event.data.bar.data('gallerize');
                
                if(data.hover) {
                    return;
                }
                
                data.hover = true;
                event.data.bar.stop().fadeIn(event.data.duration, 'linear');
            });

           this.thumbsWrapper.mouseleave({bar : this.thumbs, duration: this.settings.thumbsFadeDuration, timeout: this.settings.thumbsHideTimeout}, function(event) {
                event.data.bar.data('gallerize').hover = false;
                setTimeout(function() {
                    if(event.data.bar.data('gallerize').hover) {
                        return;
                    }
                    event.data.bar.stop().fadeOut(event.data.duration, 'linear');
                }, event.data.timeout);
            });
        }
    };
    
    Gallerize.prototype.show = function(index) {
        if(this.open) {
            return this.switchPicture(index);
        }
            
        this.open = true;
        
        $(document).bind('keyup.gallerize', $.proxy(this.onKeyUp, this));
        $(window).bind('resize.gallerize', $.proxy(this.onResize, this));
        this.screen.bind('mousewheel.gallerize', $.proxy(this.onMouseWheel, this));
        this.screen.show();

        if(typeof index == 'undefined' && this.index === null) {
            this.switchPicture(0, true);
        } else {
            this.switchPicture(index, true);
        }

        if(this.settings.fullscreen) {
            this.enableFullScreen();
        }
    };

    Gallerize.prototype.close = function() {
        if(!this.open) {
            return;
        }

        this.open = false;

        $(document).unbind('keyup.gallerize');
        $(window).unbind('resize.gallerize');
        this.screen.unbind('mousewheel.gallerize');

        this.screen.hide();

        if(this.settings.fullscreen) {
            this.disableFullScreen();
        }
    };    

    Gallerize.prototype.switchPicture = function(index, instant) {
        if(typeof index == 'undefined') {
            return;
        }

        if(index === this.index) {
            return;
        }

        var oldPicture = this.index === null ? null : this.pictures[this.index],
            picture = this.pictures[index];

        if(this.settings.showThumbs) {
            picture.thumb.toggleClass('selected');
            
            var pos = this.scroller.position().left,
                startpos = picture.thumb.position().left,
                endpos = startpos + picture.thumb.width(),
                width = this.thumbs.width(),
                newpos = pos;
            
            if((endpos + pos) > width) {
                newpos = width - endpos;
            }

            if((startpos + pos) < 0) {
                newpos = -startpos;
            }
            
            if(newpos != pos)
                this.scroller.stop(true).animate({'left': newpos + 'px'}, this.settings.thumbSlideDuration, 'linear');
                
            
            if(oldPicture !== null) {
                oldPicture.thumb.toggleClass('selected');
            }
        }

        this.index = index;
        
        picture.load();
        this.pictures[this.getNextIndex()].load();
        this.pictures[this.getPreviousIndex()].load();
        
        if(oldPicture !== null) {
            oldPicture.hide(instant);
        }

        picture.show(instant);

        if(this.settings.showCounter) {
            this.counter.html((this.index + 1) + ' / ' + this.pictures.length);
        }

        if(this.settings.showInfo) {
            if(picture.description || picture.title) {
                this.info.html('');
                
                if(picture.title) {
                    $('<div/>', {'class' : 'title'}).html(picture.title).appendTo(this.info);
                }

                if(picture.description) {
                    $('<div/>', {'class' : 'description'}).html(picture.description).appendTo(this.info);
                }

                if(!this.info.is(':visible')) {
                    this.info.fadeIn(this.settings.imageFadeDuration, 'linear');
                }
            } else if(this.info.is(':visible')) {
                this.info.fadeOut(this.settings.imageFadeDuration, 'linear');
            }
        }
    };
    
    Gallerize.prototype.getNextIndex = function() {
        var index = this.index + 1;
        
        if(index == this.pictures.length) {
            if(!this.settings.wrap) {
                return this.index;
            }

            return 0;
        }

        return index;
    };

    Gallerize.prototype.getPreviousIndex = function() {
        var index = this.index - 1;

        if(index < 0)
        {
            if(!this.settings.wrap) {
                return this.index;
            }

            return this.pictures.length - 1;
        }

        return index;
    };

    Gallerize.prototype.next = function() { this.switchPicture(this.getNextIndex()); };
    Gallerize.prototype.previous = function() { this.switchPicture(this.getPreviousIndex()); };

    Gallerize.prototype.onMouseWheel = function(event, delta, deltaX, deltaY) {
        event.preventDefault();
        
        if(deltaY > 0) {
            this.next();
        }

        if(deltaY < 0) {
            this.previous();
        }
    };

    Gallerize.prototype.onResize = function() {
        if(this.index === null) {
            return;
        }

        this.pictures[this.index].resize();
    };
 
    Gallerize.prototype.onKeyUp = function(event) {
        if(event.which == 27) {
            event.preventDefault();
            this.close();
        }

        if(event.which == 37 || event.which == 8) {
            event.preventDefault();
            this.previous();
        }

        if(event.which == 39 || event.which == 32) {
            event.preventDefault();
            this.next();
        }
    };

    Gallerize.prototype.enableFullScreen = function() {
        var screen = this.screen.get(0);
        
        if(typeof screen.requestFullScreen != 'undefined') {
            screen.requestFullScreen();
        }
        else if(typeof screen.webkitRequestFullScreen != 'undefined') {
            screen.webkitRequestFullScreen();
        }
        else if(typeof screen.mozRequestFullScreen != 'undefined') {
            screen.mozRequestFullScreen();
        }
    };

    Gallerize.prototype.disableFullScreen = function() {
        if(typeof document.cancelFullScreen != 'undefined') {
            document.cancelFullScreen();
        }
        else if(typeof document.webkitCancelFullScreen != 'undefined') {
            document.webkitCancelFullScreen();
        }
        else if(typeof document.mozCancelFullScreen != 'undefined') {
            document.mozCancelFullScreen();
        }
    };
    

    /*** jQuery boilerplate ***/

    function init(settings) {
        return this.each(function() {
            var container = $(this);
            container.data('gallerize', new Gallerize(container, settings));
        });
    }

    $.fn.gallerize = function(method) {
        if(this.length == 0) {
            return this;
        }
        
        if(typeof method === 'object' || !method) {
            return init.apply(this, arguments);
        }

        switch(method) {
            case 'show':
                if(this.length != 1) {
                    $.error('[jQuery.gallerize] You cannot show multiple galleries at once!');
                }

                var gallerize = $(this[0]).data('gallerize');

                if(typeof gallerize == 'undefined') {
                    $.error('[jQuery.gallerize] Gallerize has not been initialized on this element!');
                }

                return gallerize.show.apply(gallerize, Array.prototype.slice.call(arguments, 1));
                
            default:
                $.error('[jQuery.gallerize] Method ' + method + ' does not exist.');
        }
    };

})(jQuery);