var imagePath = "images/";
var imageFiles = ["icon16.png", "icon22.png", "icon32.png", "icon48.png", "icon128.png"]

loadImages(imageFiles, imagePath);

var canvases = [];
function loadImages(){
	for (var i = 0; i != imageFiles.length; ++i){
		loadImage(i);
	}
}

function loadImage(i){
	var image = new Image();
	image.src = imagePath + imageFiles[i];
	console.log(image.src);
	image.onload = function() {
		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		context.drawImage(image, 0, 0);
		document.body.appendChild(canvas);
		canvases.push(canvas);
		if (canvases.length === imageFiles.length) // doesn't account for errors, but...
			imagesLoaded();
	}

}

function imagesLoaded(){
	console.log("Loaded! ");
}


/*
var image1 = document.createElement('canvas');
image1.width = 32;
image1.height = 32;
var ctx1 = image1.getContext('2d');
var img32 = new Image();
img32.src = 'images/icon32.png';
img32.onload = function() {
image1.drawImage(img32, 0, 0, 32, 32);
var imageData1 = atob(image1.toDataURL('image/png').replace(/^[^,]+,/, ''));

var image2 = document.createElement('canvas');
image2.width = 16;
image2.height = 16;
var ctx2 = image2.getContext('2d');
var img16 = new Image();
img16.src = 'images/icon16.png';
img16.onload = function() {
	ctx2.drawImage(img16, 0, 0, 16, 16);
	var imageData2 = atob(image2.toDataURL('image/png').replace(/^[^,]+,/, ''));
	console.log(imageData2);
}
// https://github.com/kig/DataStream.js

var ds = new DataStream();
ds.endianness = DataStream.LITTLE_ENDIAN;

ds.writeUint16(0); // reserved
ds.writeUint16(1); // .ICO
ds.writeUint16(2); // two images

// header length is 6 + 16 * image_count bytes
var headerLength = 6 + 16 * 2;

// first image
ds.writeUint8(image1.width); // width
ds.writeUint8(image1.height); // height
ds.writeUint8(0); // not palette image
ds.writeUint8(0); // reserved
ds.writeUint16(1); // color planes
ds.writeUint16(32); // bits per pixel
ds.writeUint32(imageData1.length);
ds.writeUint32(headerLength);

// second image
ds.writeUint8(image2.width); // width
ds.writeUint8(image2.height); // height
ds.writeUint8(0); // not palette image
ds.writeUint8(0); // reserved
ds.writeUint16(1); // color planes
ds.writeUint16(32); // bits per pixel
ds.writeUint32(imageData2.length);
ds.writeUint32(headerLength + imageData1.length);

ds.writeString(imageData1);
ds.writeString(imageData2);


var ico = new Blob([ ds.buffer ]);
var url = window.URL.createObjectURL(ico);
console.log(url);
*/
