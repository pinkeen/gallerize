#!/usr/bin/env sh

lessc -O0 --yui-compress less/gallerize.less css/gallerize.css
yuicompressor js/gallerize.js -o js/gallerize.min.js

ls demo/pictures/*.jpg | while read i; do
    convert "${i}" -resize '150x^150' -gravity center -crop "150x150+0+0 +repage"  "demo/thumbs/$(basename "$i")"
done