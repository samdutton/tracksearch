

var ids = ["v9TG7OzsZqQ", "j8oFAr1YR-0", "TEwpppxgZhM", "1zvhs5FR0X8", "KOsJIhmeXoc", "X_ek1wSe66o", "2txPYQOWBtg", "ie4I7B-umbA", "jD_-r6y558o", "x9KOS1VQgqQ", "hAzhayTnhEI", "Prkyd5n0P7k", "YxogQGnMA9Y", "bsGgfUreyZw", "3pxf3Ju2row", "UC9LwtA_MC8", "Mk-tFn2Ix6g", "O1YjdKh-rPg", "E8C8ouiXHHk", "VOf27ez_Hvg", "6EJ801el-I8", "GBxv8SaX0gg", "hFsCG7v9Y4c", "0G9OaTzdOa0", "bwOhfoewMYs", "EvACKPBo_R8", "v9TG7OzsZqQ"];
var tracksPath = "tracks/";
var trackSuffix = ".vtt";

for (var i = 0; i != ids.length; ++i) {
	var trackElement = document.createElement("track");
	trackElement.default = true;
	trackElement.src = tracksPath + ids[i] + trackSuffix;
	var videoElement = document.createElement("video");
	videoElement.appendChild(trackElement);
	videoElement.style.display = "none";
	document.body.appendChild(videoElement);
	trackElement.addEventListener("load", function() {
		var textTrack = this.track; 
	  console.log(Date.now(), textTrack.cues[0].text);
	});
}