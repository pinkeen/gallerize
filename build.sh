#!/usr/bin/env sh

lessc -O0 --yui-compress less/gallerize.less css/gallerize.css
yuicompressor js/gallerize.js -o js/gallerize.min.js