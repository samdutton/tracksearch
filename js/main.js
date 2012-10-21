
var tracksPath = "tracks/";
var trackSuffix = ".vtt";
var resultsDiv = $("#results");
var query;

function insertCue(tx, videoId, cue){
  tx.executeSql('INSERT INTO cues (videoId, startTime, text) VALUES (?, ?, ?)',
    [videoId, cue.startTime, cue.text]);
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

// http://storage.googleapis.com/io2012/headshots/mkwst.jpg
// http://img.youtube.com/vi/3pxf3Ju2row/hqdefault.jpg

function updateVideoData(videoId){
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://gdata.youtube.com/feeds/api/videos/" + videoId + "?alt=json");
	xhr.onreadystatechange = function() {
	  if (xhr.readyState === 4 && xhr.status === 200) {
	    var obj = JSON.parse(xhr.responseText);
	  	videos[videoId].viewCount = obj.entry.yt$statistics.viewCount;
	    videos[videoId].rating = obj.entry.gd$rating.average;
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
	// must add videoElement to body for track load event to fire :^\
	document.body.appendChild(videoElement);

	trackElement.addEventListener("load", function() {
		var textTrack = this.track;
		insertCues(this.videoId, textTrack.cues);
	});
}

function buildTracksAndVideoData() {
	for (var id in videos) {
		updateVideoData(id);
		makeTrack(id);
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

var youTubePlayer = document.querySelector(".youtube-player");
// toggle display of cue or query results
function addClickHandler(cueDiv, cue) {
  cueDiv.click(function() {
  	// don't reload video if the clicked cue is for current video
		if (youTubePlayer.src.indexOf(cue.videoId) != -1){
			callPlayer("youTubePlayer", "seekTo", [cue.startTime]);
		} else {
			youTubePlayer.src =
				"http://www.youtube.com/embed/" + cue.videoId +
				"?start=" + cue.startTime +
				"&autoplay=1&enablejsapi=1"
		}
	});
}

function displayResults(transaction, results) {
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
			var video = videos[currentVideoId];
			videoDiv = $("<div class='video' />");
			videoDiv.append("<div class='videoTitle' + title='" + video.summary.replace(/'/g, "&#39;") +
				"\n\nRating: " + video.rating +
				"\nView count: " + video.viewCount +
				"'>" + video.title + "</div>");
			if (video.speakers.length !== 0){
				videoDiv.append("<div class='speakers'>" + video.speakers.join(", ") + "</div>");
			}
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

// most of this code is to wait a bit while query text is entered
// would be better done with setTimeout
var currentValue, interval;
var isListeningForInput  = false;
var $query = $("#query");
$query.bind('input', function() {
	currentValue = $(this).val();
  if (currentValue.length < 2) {
		resultsDiv.empty();
    return false;
  }
 	if (!isListeningForInput){
 		isListeningForInput = true;
		interval = setInterval(function(){
			console.log();
			if ($query.val() === currentValue){
		 		clearInterval(interval);
		 		isListeningForInput = false;
				query = $query.val();
			  // could cache results and sanitise input
			  var statement = 'SELECT videoId, startTime, text ' +
			  	'FROM cues WHERE text like "%' + query + '%"';
			  doReadQuery(statement, displayResults);
			} else {
				currentValue = $query.val();
			}
		}, 300);
	}
});

function elapsedTimer(message) {
    if (elapsedTimer.isStarted) {
        console.log(message, (Date.now() - elapsedTimer.startTime));
        elapsedTimer.startTime = Date.now();
    } else {
        elapsedTimer.startTime = Date.now();
        elapsedTimer.isStarted = true;
    }
}

// Convert decimal time to mm:ss, e.g. convert 123.3 to 2:03
function toMinSec(decimalSeconds){
	var mins = Math.floor(decimalSeconds/60);
	var secs = Math.floor(decimalSeconds % 60);
	if (secs < 10) {
		secs = "0" + secs
	};
	return mins + ":" + secs;
}

