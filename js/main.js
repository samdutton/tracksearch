var videoIds = ["v9TG7OzsZqQ", "j8oFAr1YR-0", "TEwpppxgZhM", "1zvhs5FR0X8", "KOsJIhmeXoc", "X_ek1wSe66o",
	"2txPYQOWBtg", "ie4I7B-umbA", "jD_-r6y558o", "x9KOS1VQgqQ", "hAzhayTnhEI", "Prkyd5n0P7k", "YxogQGnMA9Y",
	"bsGgfUreyZw", "3pxf3Ju2row", "UC9LwtA_MC8", "Mk-tFn2Ix6g", "O1YjdKh-rPg", "E8C8ouiXHHk", "VOf27ez_Hvg",
	"6EJ801el-I8", "GBxv8SaX0gg", "hFsCG7v9Y4c", "0G9OaTzdOa0", "bwOhfoewMYs", "EvACKPBo_R8"];
var tracksPath = "tracks/";
var trackSuffix = ".vtt";
var resultsDiv = $("#results");

function insertCue(tx, videoId, cue){
  tx.executeSql('INSERT INTO cues (videoId, startTime, endTime, text) VALUES (?, ?, ?, ?)',
    [videoId, cue.startTime, cue.endTime, cue.text]);
}

// insert cues for a TextTrack
function insertCues(videoId, cues) {
//	console.log(videoId, cues.length);
  db.transaction(function(tx){
	  for (var i = 0; i != cues.length; ++i) {
	  	var cue = cues[i];
	  	if (typeof cue !== "undefined" && cue.text !== "") {
				insertCue(tx, videoId, cues[i]);
			}
	  }
  }, transactionErrorHandler, null);
}

// http://img.youtube.com/vi/3pxf3Ju2row/hqdefault.jpg
var videos = {};
function getVideoData(videoId){
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://gdata.youtube.com/feeds/api/videos/" + videoId + "?alt=json");
	xhr.onreadystatechange = function() {
	  if (xhr.readyState === 4 && xhr.status === 200) {
	    var video = {};
	    var obj = JSON.parse(xhr.responseText);
	    video.summary = obj.entry.content.$t;
	    var content = obj.entry.content.$t.split("\n\n");
	    video.speakers = content[0];// can check length to determine if correct
	    video.viewCount = obj.entry.yt$statistics.viewCount;
	    video.rating = obj.entry.gd$rating.average;
	    video.title = obj.entry.title.$t;
	    videos[videoId] = video;
	    console.log("title: ", videos[videoId].title);
	    console.log("speakers: ", videos[videoId].speakers);
	    console.log("obj", obj);
	    console.log("content[1]", content[1]);
	    console.log("content[2]", content[2]);
//	    console.log("summary", videos[videoId].summary);
			console.log("......");
	  }
	}
	xhr.send();
}

function makeTrack(videoId){
	var trackElement = document.createElement("track");
	trackElement.default = true;
	trackElement.src = tracksPath + videoId + trackSuffix;
	trackElement.videoId = videoId; // adding property

	var videoElement = document.createElement("video");
	videoElement.appendChild(trackElement);
	videoElement.style.display = "none";
	document.body.appendChild(videoElement);

	trackElement.addEventListener("load", function() {
		var textTrack = this.track;
		insertCues(this.videoId, textTrack.cues);
	});
}

function buildTracksAndVideoData() {
	for (var i = 0; i != videoIds.length; ++i) {
		var videoId = videoIds[i];
		getVideoData(videoId);
		makeTrack(videoId);
	}
}

// open the cues database
// then, if necessary, insert cues into the cues table
// short name, version, display name, max size (made-up number...)
// if transaction is successful insert cues into table
var db = openDatabase('cues', '1.0', 'cues', 100 * 1024 * 1024);
db.transaction(function (tx) {
    tx.executeSql('DROP TABLE IF EXISTS cues');
    tx.executeSql('CREATE TABLE IF NOT EXISTS cues (' +
    	'videoId varchar(15), startTime varchar(15), endTime varchar(15), text varchar(255))',
		[], null, queryErrorHandler);
}, transactionErrorHandler, buildTracksAndVideoData);


function showCount() {
    var statement = "SELECT COUNT(*) FROM cues";
    doReadQuery(statement, showResults);
}


function elapsedTimer() {
    if (elapsedTimer.isStarted) {
        console.log("Elapsed: " + (Date.now() - elapsedTimer.startTime));
        elapsedTimer.isStarted = false;
    } else {
        elapsedTimer.startTime = Date.now();
        elapsedTimer.isStarted = true;
    }
}

var youTubePlayer = document.querySelector(".youtube-player");
// toggle display of cue or query results
function addClickHandler(cueDiv, cue) {
  cueDiv.click(function() {
//		console.log(cue.videoId, cue.startTime);
//		console.log(youTubePlayer.getVideoUrl());
//		console.log(youTubePlayer.videoId);
//		if (youTubePlayer.src()) {youTubePlayer.seekTo(cue.startTime)}
// else {}
		youTubePlayer.src =
			"http://www.youtube.com/embed/" + cue.videoId +
			"?start=" + cue.startTime +
			"&autoplay=1&enablejsapi=1"
	});
}

function displayResults(transaction, results) {
//    elapsedTimer();
	resultsDiv.empty();
	if (!query) { // !!!hack: to cope with inputting long query then quickly deleting
		return;
	}
	var currentVideoId, videoDiv, cuesDiv;
	var i;
  for (i = 0; i !== results.rows.length; ++i) {
    var cue = results.rows.item(i);
		// for each video (i.e. new currentVideoId)
		// create divs and add the video title,
		// then add a click handler to display video
		if (!currentVideoId || currentVideoId !== cue.videoId) {
			currentVideoId = cue.videoId;
			videoDiv = $("<div class='video' />");
			videoDiv.append("<div class='videoTitle'>" + videos[cue.videoId].title + "</div>");
			cuesDiv = $("<div class='cues' title='Click to play video at this point' />");
			videoDiv.append(cuesDiv);
			resultsDiv.append(videoDiv);
		}
		// add cue to div.cues
		var cueDiv = $("<div class='cue'><span class='cueStartTime'>" +
				toMinSec(cue.startTime) + ": </span><span class='cueText'>" +
				cue.text.replace(new RegExp("(" +
				query + ")", "gi"),
			"<em>$1</em>") + "</span></div>"); // empasise query
		addClickHandler(cueDiv, cue);
		cuesDiv.append(cueDiv);
  }
}

var query;
$(document).ready(function() {
    $("#query").bind('input', function() {
      query = $(this).val();
      if (query.length < 2) {
				resultsDiv.empty();
        return false;
      }
	    // could use caching of results for query -- and does not cope with pathological input, such as double quotes
	    var statement = 'SELECT videoId, startTime, endTime, text FROM cues WHERE text like "%' + query + '%"';
	    doReadQuery(statement, displayResults);
    });
});

// Convert decimal time to mm:ss, e.g. convert 123.3 to 2:03
function toMinSec(decimalSeconds){
	var mins = Math.floor(decimalSeconds/60);
	var secs = Math.floor(decimalSeconds % 60);
	if (secs < 10) {
		secs = "0" + secs
	};
	return mins + ":" + secs;
}
