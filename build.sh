#!/usr/bin/env sh

lessc less/gallerize.less css/gallerize.css
uglifyjs js/gallerize.js > js/gallerize.min.js

ls demo/pictures/*.jpg | while read i; do
    convert "${i}" -resize '150x^150' -gravity center -crop "150x150+0+0 +repage"  "demo/thumbs/$(basename "$i")"
done
