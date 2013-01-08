var tracksPath = "tracks/";
var trackSuffix = ".vtt";
var resultsDiv = $("#results");
var query;
var $query = $("#query");
var $numResults = $("#numResults");

function insertCue(tx, videoId, cue){
  tx.executeSql('INSERT INTO cues (videoId, startTime, text) VALUES (?, ?, ?)',
    [videoId, cue.startTime, cue.text]);
}

var numTracks = 0;
// insert cues for a TextTrack
function insertCues(videoId, cues) {
  db.transaction(function(tx){
	  for (var i = 0; i != cues.length; ++i) {
	  	var cue = cues[i];
	  	if (typeof cue !== "undefined" && cue.text !== "") {
				insertCue(tx, videoId, cues[i]);
			}
	  }
  }, transactionErrorHandler,
  function(){
  	// window.numTracks += 1;
  	// if (window.numTracks < 165){
  	// 	$query[0].disabled = false;
  	// }
  });
}

// http://storage.googleapis.com/io2012/headshots/mkwst.jpg

// update video data from YouTube
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

// utility function
// function showCount() {
//     var statement = "SELECT COUNT(*) FROM cues";
//     doReadQuery(statement, showResults);
// }

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
  $("#numResults").empty();
	if ($query.val().length < 2) {
    return false;
  }

	var numResults = results.rows.length;
	var currentVideoId, videoDiv, cuesDiv;
	var i;
	// hack: to enable matching (for example) two letter combinations
	// but avoiding matches for common combinations
	if (numResults > 5000){
		$numResults.html(numResults + " results (too many to display)");
		return;
	} else {
		$numResults.html(numResults + " result(s)");
	}
  for (i = 0; i !== numResults; ++i) {
    var cue = results.rows.item(i);
		// for each video (i.e. new currentVideoId)
		// create divs and add the video title,
		// then add a click handler to display video
		if (!currentVideoId || currentVideoId !== cue.videoId) {
			currentVideoId = cue.videoId;
			var video = videos[currentVideoId];
			videoDiv = $("<div class='video' />");

			var detailsDiv = $("<details class='videoDetails' />");
			detailsDiv.append("<summary class='videoTitle' title='Click to view video information'>" + video.title + "</summary>");
			detailsDiv.append("<img class='videoThumbnail' src='http://img.youtube.com/vi/" +
				currentVideoId + "/hqdefault.jpg' title='Default thumbnail image' />");
			if (!!video.summary){
				detailsDiv.append("<div class='videoSummary'>" + video.summary + "</div>");
			}
			detailsDiv.append("<div class='videoRating'><strong>Rating: </strong>" +
				video.rating + "</div>");
			detailsDiv.append("<div class='videoViewCount'><strong>View count: </strong>" +
				video.viewCount + "</div>");
			videoDiv.append(detailsDiv);

			if (video.speakers && video.speakers.length !== 0){
				videoDiv.append("<div class='speakers'>" + video.speakers.join(", ") + "</div>");
			}

			cuesDiv = $("<div class='cues' title='Click to play video at this point' />");
			videoDiv.append(cuesDiv);
			resultsDiv.append(videoDiv);
		}

		var cueStartTimeHTML = "<span class='cueStartTime'>" + toMinSec(cue.startTime) + ": </span>";
		var cueTextHTML = cue.text.replace(new RegExp("(" + query + ")", "gi"), "<em>$1</em>"); // empasise query
		cueTextHTML = "<span class='cueText'>" + cueTextHTML + "</span>";
		// add cue to div.cues
		var cueDiv =
			$("<div class='cue'>" +
			cueStartTimeHTML +
			cueTextHTML +
			"</div>");
		addClickHandler(cueDiv, cue);
		cuesDiv.append(cueDiv);
  }
}

$query.bind('input', function() {
	resultsDiv.empty();
	query = $(this).val();
  if (query.length < 2) {
    return false;
  }
	if(typeof(window.inputTimeout) != "undefined"){
		window.clearTimeout(inputTimeout);
	}
	window.inputTimeout = window.setTimeout(function() {
	  var statement = 'SELECT videoId, startTime, text FROM cues WHERE text like "%' + query + '%"';
	  doReadQuery(statement, displayResults);
	}, 300); // 300ms delay between getting keypress
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

