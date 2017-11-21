#!/bin/bash

INK=/Applications/Inkscape.app/Contents/Resources/bin/inkscape
IM="magick"

if [ ! -f "$INK" ]; then
	INK="C:/Program Files (x86)/Inkscape/inkscape"
fi

IOS="resources/ios/icon/icon"
ANDROID="resources/android/icon/drawable"
WP="resources/wp8/icon"
SVG="resources/icon.svg"


"$INK" -z -D -e "$IOS-40.png" -f 	"$SVG" -w 40 -h 40
"$INK" -z -D -e "$IOS-40@2x.png" -f 	"$SVG" -w 80 -h 80
"$INK" -z -D -e "$IOS-40@3x.png" -f 	"$SVG" -w 120 -h 120
"$INK" -z -D -e "$IOS-50.png" -f 	"$SVG" -w 50 -h 50
"$INK" -z -D -e "$IOS-50@2x.png" -f 	"$SVG" -w 100 -h 100
"$INK" -z -D -e "$IOS-60.png" -f 	"$SVG" -w 60 -h 60
"$INK" -z -D -e "$IOS-60@2x.png" -f 	"$SVG" -w 120 -h 120
"$INK" -z -D -e "$IOS-60@3x.png" -f 	"$SVG" -w 180 -h 180
"$INK" -z -D -e "$IOS-72.png" -f 	"$SVG" -w 72 -h 72
"$INK" -z -D -e "$IOS-72@2x.png" -f 	"$SVG" -w 144 -h 144
"$INK" -z -D -e "$IOS-76.png" -f 	"$SVG" -w 76 -h 76 
"$INK" -z -D -e "$IOS-76@2x.png" -f 	"$SVG" -w 152 -h 152
"$INK" -z -D -e "$IOS-83.5@2x.png" -f 	"$SVG" -w 167 -h 167
"$INK" -z -D -e "$IOS-1024.png" -f 	"$SVG" -w 1024 -h 1024
"$INK" -z -D -e "$IOS-small.png" -f 	"$SVG" -w 29 -h 29
"$INK" -z -D -e "$IOS-small@2x.png" -f 	"$SVG" -w 58 -h 58
"$INK" -z -D -e "$IOS-small@3x.png" -f 	"$SVG" -w 87 -h 87
"$INK" -z -D -e "$IOS.png" -f 	"$SVG" -w 57 -h 57
"$INK" -z -D -e "$IOS@2x.png" -f 	"$SVG" -w 114 -h 114

for filename in "$IOS"*.png; do
	"$IM" "$filename" -background white -alpha remove "$filename"
done

"$INK" -z -D -e "$ANDROID-ldpi-icon.png" -f 	"$SVG" -w 36 -h 36
"$INK" -z -D -e "$ANDROID-mdpi-icon.png" -f 	"$SVG" -w 48 -h 48
"$INK" -z -D -e "$ANDROID-hdpi-icon.png" -f 	"$SVG" -w 72 -h 72
"$INK" -z -D -e "$ANDROID-xhdpi-icon.png" -f 	"$SVG" -w 96 -h 96
"$INK" -z -D -e "$ANDROID-xxhdpi-icon.png" -f 	"$SVG" -w 144 -h 144
"$INK" -z -D -e "$ANDROID-xxxhdpi-icon.png" -f 	"$SVG" -w 192 -h 192

"$INK" -z -D -e "$WP/ApplicationIcon.png" -f 	"$SVG" -w 99 -h 99
"$INK" -z -D -e "$WP/Background.png" -f 	"$SVG" -w 159 -h 159
