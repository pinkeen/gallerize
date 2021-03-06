/*!
 *   Gallerize - A jQuery Fullscreen Gallery Plugin                         
 *   2012 (c) Filip Sobalski <pinkeen@gmail.com>                            
 *                                                                        
 *   Licensed under the MIT License.
 */
(function($)
{
    "use strict";
 
    /* 
     * Picture class
     * 
     * Responsible for handling a single picture. 
     */

    function Picture(attrs, container, settings) {
        this.src = attrs.src;
        this.thumb = attrs.thumb;
        this.title = attrs.title;
        this.description = attrs.description;
        
        this.loaded = false;
        this.visible = false;
        this.fitScreen = settings.fitScreen;
        this.container = container;
        
        this.spinner = $('<div class="glize-spinner"></div>').appendTo(this.container);
    }

    Picture.prototype.load = function() {
        if(this.loaded) {
            return;
        }

        this.wrapper = $('<div class="glize-picture"></div>');
        
        if(this.title || this.description) {
            var info = $('<div class="glize-info glize-box"></div>').appendTo(this.wrapper);
            
            if(this.title) {
                $('<div class="glize-title"></div>')
                    .html(this.title)
                    .appendTo(info);
            }
            
            if(this.description) {
                $('<div class="glize-description"></div>')
                    .html(this.description)
                    .appendTo(info);
            }
        }
        
        this.image = $('<img/>').appendTo(this.wrapper);
        this.image.load($.proxy(this.onLoaded, this));
        /* Do this after .load() to fix IE caching issues. */
        this.image.attr('src', this.src);
        this.container.append(this.wrapper);
    };

    Picture.prototype.onLoaded = function() {
        if(this.loaded) {
            return;
        }        
        
        this.loaded = true;
        this.spinner.replaceWith(this.wrapper);
        
        this.width = this.image[0].width;
        this.height = this.image[0].height;
        this.ratio = this.width / this.height;

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

        var cWidth = this.container.width(),
            cHeight = this.container.height(),
            cRatio = cWidth / cHeight,
            nWidth, nHeight, nTop, nLeft;
        
        if(this.fitScreen || this.height > cHeight || this.width > cWidth) {
            if(this.ratio > cRatio) {
                nWidth = cWidth;
                nHeight = nWidth / this.ratio;
                nLeft = 0;
                nTop = (cHeight - nHeight) / 2.0;
            } else {
                nHeight = cHeight;
                nWidth = nHeight * this.ratio;
                nTop = 0;
                nLeft = (cWidth - nWidth) / 2.0;
            }
        }
        else if(!this.fitScreen) {
            nWidth = this.width;
            nHeight = this.height;
            nLeft = (cWidth - nWidth) / 2.0;
            nTop = (cHeight - nHeight) / 2.0;
        }
        
        this.image.css('width', Math.floor(nWidth) + 'px');
        this.image.css('height', Math.floor(nHeight) + 'px');
        this.wrapper.css('left', Math.floor(nLeft) + 'px');
        this.wrapper.css('top', Math.floor(nTop) + 'px');
    };

    Picture.prototype.show = function() {
        if(this.loaded) {
            this.wrapper.addClass('glize-picture-current');
            this.resize();
        }
        else {
            this.spinner.show();
        }

        this.visible = true;
    };

    Picture.prototype.hide = function() {
        if(this.loaded) {
            this.wrapper.removeClass('glize-picture-current');
        } else {
            this.spinner.hide();
        }

        this.visible = false;
    };
    
    /*
     * Gallerize class 
     * 
     * Prepares and handles a single instance of the gallery.
     */
    
    function Gallerize(container, settings) {
        this.settings = $.extend(true, {
            fitScreen : true,
            wrap: true,
            fullscreen: false,
            preloadAll: false,
            showInfo: true,
            showThumbs: true,
            imgAsSource: false, // img src as big image and thumb
            thumbSlideDuration: 300
        }, settings);

        this.index = null;
        this.pictures = [];
        this.container = container;
        this.container.data('gallerize', this);
        this.open = false;
        this.fitScreen = this.settings.fitScreen;
        this.screen = $('<div class="gallerize"></div>').appendTo($('body'));
        
        var self = this,
            elements = container.find('a > img');

        if(elements.length == 0) {
            $.error('[jQuery.gallerize] No pictures found.');
        }
        
        elements.each(function() {
            var img = $(this),
                a = img.parent(),
                attrs = {
                    src: self.settings.imgAsSource ? img.attr('src') : a.attr('href'),
                    thumb: img.attr('src'),
                    title: a.attr('title'),
                    description: img.attr('alt')
                },
                picture = new Picture(attrs, self.screen, self.settings);

            if(self.settings.preloadAll) {
                picture.load();
            }

            a.data('gallerize', {
                gallerize: self,
                index: self.pictures.push(picture) - 1
            });
           
            a.click(function(event) {
                var data = $(this).data('gallerize');
                event.preventDefault();
                data.gallerize.show(data.index);
            });
        });

        if(this.settings.showThumbs) {
            this.createThumbs();
        }

        $('<div class="glize-buttons"></div>')
            .appendTo(this.screen)
            .append(
                $('<div class="glize-btn glize-btn-close"></div>').click(function() { self.close(); })
            );

        $('<div class="glize-arrow-area glize-arrow-area-left"><div class="glize-arrow glize-arrow-left"></div></div>')
            .appendTo(this.screen)
            .click(function() { self.previous(); });
            
        $('<div class="glize-arrow-area glize-arrow-area-right"><div class="glize-arrow glize-arrow-right"></div></div>')
            .appendTo(this.screen)
            .click(function() { self.next(); });
    }

    Gallerize.prototype.setSize = function(fitScreen) {
        this.fitScreen = fitScreen;
        
        for(var i = 0; i < this.pictures.length; i++) {
            this.pictures[i].setSize(fitScreen);
        }
    };

    Gallerize.prototype.createThumbs = function() {
        this.thumbsWrapper = $('<div class="glize-thumbs-wrapper"></div>').appendTo(this.screen);
        this.thumbs = $('<div class="glize-thumbs"></div>').appendTo(this.thumbsWrapper);
        this.scroller = $('<div class="glize-scroller"></div>').appendTo(this.thumbs);
        this.thumbsInner = $('<div/>').appendTo(this.scroller).css('float', 'left');

        var index,
            thumbClick = $.proxy(function(event) {
                this.switchPicture(parseInt(event.data.index, 10));
            }, this);

        for(index = 0; index < this.pictures.length; index++) {
            var picture = this.pictures[index];
            
            picture.thumb = $('<div class="glize-thumb"></di>').append(
                $('<img/>', {'src' : picture.thumb}).on('dragstart', function() { return false; }),
                $('<div class="glize-overlay"></div>')
            ).appendTo(this.thumbsInner);
            
            picture.thumb.click({index: index}, thumbClick);
        }
        
       
        this.thumbs.mousemove({thumbs: this.thumbs, inner: this.thumbsInner, scroller: this.scroller}, function(event) {
            if(event.data.scroller.is(':animated')) {
                event.data.scroller.stop();
            }
            
            var tw = event.data.thumbs.width(),
                iw = event.data.inner.width(),
                x;

            if(iw <= tw) {
                return;
            }
            
            x = Math.round((event.clientX / tw) * (iw - tw));
            event.data.scroller.css('left', -x + 'px');
        });

        if(this.settings.thumbsAlwaysVisible) {
            this.thumbs.show();
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

    Gallerize.prototype.switchPicture = function(index) {
        if(typeof index == 'undefined') {
            return;
        }

        if(index === this.index) {
            return;
        }

        var oldPicture = this.index === null ? null : this.pictures[this.index],
            picture = this.pictures[index];

        if(this.settings.showThumbs) {
            picture.thumb.toggleClass('glize-selected');
            
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
            
            if(newpos != pos) {
                this.scroller.stop(true).animate({'left': newpos + 'px'}, this.settings.thumbSlideDuration, 'linear');
            }
            
            if(oldPicture !== null) {
                oldPicture.thumb.toggleClass('glize-selected');
            }
        }

        this.index = index;
        
        picture.load();
        this.pictures[this.getNextIndex()].load();
        this.pictures[this.getPreviousIndex()].load();
        
        if(oldPicture !== null) {
            oldPicture.hide();
        }

        picture.show();
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

        if(index < 0) {
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
    

    /*
     * jQuery boilerplate 
     */

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