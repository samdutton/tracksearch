var ids = ["v9TG7OzsZqQ", "j8oFAr1YR-0", "TEwpppxgZhM", "1zvhs5FR0X8", "KOsJIhmeXoc", "X_ek1wSe66o", "2txPYQOWBtg", "ie4I7B-umbA", "jD_-r6y558o", "x9KOS1VQgqQ", "hAzhayTnhEI", "Prkyd5n0P7k", "YxogQGnMA9Y", "bsGgfUreyZw", "3pxf3Ju2row", "UC9LwtA_MC8", "Mk-tFn2Ix6g", "O1YjdKh-rPg", "E8C8ouiXHHk", "VOf27ez_Hvg", "6EJ801el-I8", "GBxv8SaX0gg", "hFsCG7v9Y4c", "0G9OaTzdOa0", "bwOhfoewMYs", "EvACKPBo_R8", "v9TG7OzsZqQ"];
var tracksPath = "tracks/";
var trackSuffix = ".vtt";

function insertCue(id, cue){
  db.transaction(function(tx){
  // insert row with video id, cue startTime, endTime and text
  tx.executeSql('INSERT INTO cues (id, startTime, endTime, text) VALUES (?, ?, ?, ?)',
      [id, cue.startTime, cue.endTime, cue.text]);
  }, transactionErrorHandler, null);
}

// insert cues for a TextTrack
function insertCues(id, cues) {
	console.log(id, cues.length);
  for (var i = 0; i != cues.length; ++i) {
		insertCue(id, cues[i]);
  }
}

function getCues() {
	for (var i = 0; i != ids.length; ++i) {
		var id = ids[i];
		var trackElement = document.createElement("track");
		trackElement.default = true;
		trackElement.src = tracksPath + id + trackSuffix;
		trackElement.id = id; // adding property

		var videoElement = document.createElement("video");
		videoElement.appendChild(trackElement);
		videoElement.style.display = "none";
		document.body.appendChild(videoElement);

		trackElement.addEventListener("load", function() {
			var textTrack = this.track; 
			insertCues(this.id, textTrack.cues);
		});
	}
}

// open the cues database
// then, if necessary, insert cues into the cues table
var db = openDatabase('cues', '1.0', 'cues', 100 * 1024 * 1024); // short name, version, display name, max size (made-up number...)
// if transaction is successful insert cues into table
db.transaction(function (tx) {
    tx.executeSql('DROP TABLE IF EXISTS cues');
    tx.executeSql('CREATE TABLE IF NOT EXISTS cues (id varchar(15), startTime varchar(15), endTime varchar(15), text varchar(255))',  
		[], null, queryErrorHandler); 
}, transactionErrorHandler, getCues);

function insertcuesTest() {
    db.transaction(function(tx){
		var i;
        for (i = 0; i !== 20000; ++i) {
            tx.executeSql('INSERT INTO cues (id, startTime, endTime, text) VALUES (?, ?, ?, ?)',
                [i, "00:01:11.111", "00::22.222", "Shall I compare thee to a summer day?"]);
        }
    }, transactionErrorHandler, showCount);
}

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
/*
// toggle display of cue or query results
function addClickHandler(cueDiv, linesDiv, cueIndex, query) {
	var isUnexpanded = true;
    var expandedHTML, unexpandedHTML; // to cache 'unexpanded' query results and 'expanded' whole cue
    cueDiv.click(function() {
		if (isUnexpanded) { // if only query results are shown, display whole cue
			cueDiv.attr("title", "Click to display a facsimile of the sonnet");
			unexpandedHTML = $(this).html();
			if (expandedHTML) { // if not the first time...
				$(this).html(expandedHTML);
			} else {
				linesDiv.html("");
				var cue = cues[cueIndex];
				cue.lines.forEach(function(line, index, lines){
					var lineDiv = $("<div class='line' />");
					lineDiv.append("<div class='lineText'>" + 
						line.replace(new RegExp("(" + query + ")", "gi"), "<em>$1</em>") + "</div>");
					var lineNumber = index + 1;
					if (lineNumber % 5 === 0) {
						lineDiv.append("<div class='lineNumber'>" + lineNumber + "</div>");
					}
					linesDiv.append(lineDiv);
				});		
			}
			
			isUnexpanded = false;
		} else { // whole cue is shown: display only query result lines
			var sonnetNumber = parseInt(cueIndex, 10) + 1;
			window.open("http://internetshakespeare.uvic.ca/Library/facsimile/bookplay/UC_Q1_Son/Son/" +
				sonnetNumber + "/?zoom=5");
//			expandedHTML = $(this).html();
//			$(this).html(unexpandedHTML);
//			isUnexpanded = true;
		}
    });
}

function addDoubleClickHandler(cueDiv, sonnetNumber){
    cueDiv.dblclick(function(){
		window.open("http://internetshakespeare.uvic.ca/Library/facsimile/bookplay/UC_Q1_Son/Son/" + sonnetNumber + "/?zoom=5");
	});
}

function displayResults(transaction, results) {
//    elapsedTimer();
	if (!query) { // !!!hack: to cope with inputting long query then quickly deleting
		return;
	}
    var resultsDiv = $("<div class='results' />"); //
	var currentcueIndex, cueDiv, linesDiv;
	var i;
    for (i = 0; i !== results.rows.length; ++i) {
        var line = results.rows.item(i);
		// for each new cue (i.e. new currentcueIndex)
		// create divs and add the cue title, 
		// then add a click handler to toggle display of the whole cue
		if (!currentcueIndex || currentcueIndex !== line.cueIndex) {
			currentcueIndex = line.cueIndex;
			cueDiv = $("<div class='cue' title='Click to display the whole sonnet' />");
			cueDiv.append("<div class='cueTitle'>" + line.cueTitle + "</div>");			
			resultsDiv.append(cueDiv);
			linesDiv = $("<div class='lines' />").attr("cueIndex", line.cueIndex); // attr used to get html in click handler
			cueDiv.append(linesDiv);
			addClickHandler(cueDiv, linesDiv, line.cueIndex, query); 
		}
		// add line to div.lines
		linesDiv.append("<div class='line'><div class='lineText'>" + 
			line.lineText.replace(new RegExp("(" + query + ")", "gi"), "<em>$1</em>") + 
			"</div><div class='lineNumber'>" + line.lineNumber + "</div></div>");       
    }
//	$("body").css("background-image", "url('images/background.jpg')");
    $("#resultsContainer").html(resultsDiv);
//    elapsedTimer();
}

var query;
$(document).ready(function() {
//    $("#query").focus(); // done with input autofocus attribute
    $("#query").bind('input', function() {
        query = $(this).val();
        if (query.length < 2) {
			$("#resultsContainer").empty();			
            return false;
        }
		// console.log(query);
        // could use caching of results for query -- and does not cope with pathological input, such as double quotes
        var statement = 'SELECT cueIndex, cueTitle, lineNumber, lineText FROM cues WHERE lineText like "%' + query + '%"'; 
        doReadQuery(statement, displayResults);
    });
});
*/