var hash = window.location.hash;
hash = hash.substr(1,hash.length);
var new_room = false;
if (hash === ""){
    hash = window.location.hash = Math.random().toString(36).substr(5);
    new_room = true;
}
$('#roomName').text(hash);

var name = $.cookie(hash+'name');
if(name == "undefined") { 
    var name = prompt("Your name?", "Visitor");
    $.cookie(hash+'name', name,{expires: 365});
}

var currentStatus = "★",
    userListRef = new Firebase("https://purcellchat.firebaseIO.com/"+hash+"/userlist"),
    myUserRef = userListRef.push(),
    connectedRef = new Firebase("https://purcellchat.firebaseIO.com/.info/connected");
connectedRef.on("value", function(isOnline) {
  if (isOnline.val()) {
    myUserRef.onDisconnect().remove();
    setUserStatus("★");
  } else {

    setUserStatus(currentStatus);
  }
});

function setUserStatus(status) {
  currentStatus = status;
  myUserRef.set({ name: name, status: status });
}

userListRef.on("child_added", function(snapshot) {
  var user = snapshot.val();
  $("#presenceDiv").append($("<li/>").attr("id", snapshot.name()));
  $("#" + snapshot.name()).text(user.name + "  " + user.status);
});

userListRef.on("child_removed", function(snapshot) {
  $("#" + snapshot.name()).remove();
});

userListRef.on("child_changed", function(snapshot) {
  var user = snapshot.val();
  $("#" + snapshot.name()).text(user.name + " " + user.status);
});

document.onIdle = function () {
  setUserStatus("☆");
}
document.onAway = function () {
  setUserStatus("☄");
}
document.onBack = function (isIdle, isAway) {
  setUserStatus("★");
}

setIdleTimeout(10000);
setAwayTimeout(60000);



// Get a reference to the root of the chat data.
var messagesRef = new Firebase("https://purcellchat.firebaseIO.com/"+hash+"/chats");

// When the user presses enter on the message input, write the message to firebase.
$('#messageInput').keypress(function (e) {
  if (e.keyCode == 13) {
    var text = $('#messageInput').val();
    messagesRef.push({name:name, text:text, timestamp: $.now() });
    $('#messageInput').val('');
  }
});


var limits = 20;

// Add a callback that is triggered for each chat message.
messagesRef.limit(limits).on('child_added', function (snapshot) {
  var message = snapshot.val();
  
  var cont = $('<tr/>');
  $('<td/>').addClass('nameCol').text(message.name).append('<br>'+displayTime(message.timestamp)).appendTo(cont);
  $('<td/>').addClass('msgCol').html(parseText(message.text)).appendTo(cont);
  cont.appendTo('#messagesDiv');

   document.title = message.text.substring(0,10) + '... #'+ hash;
  
  
  $('#messageWrap').height( $(window).height()-($('#chatWrap').height()) ).scrollTop($('#toolbar')[0].scrollHeight);
});

$('#messageWrap').scrollTop($('#messageWrap')[0].scrollHeight);

function parseText(inputText) {
    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    replacePattern = /(https?:\/\/.*\.(?:png|jpg|gif|jpeg))/i;
    
    var replaced = inputText.search(replacePattern) >= 0;
    if(replaced){
        replacedText = inputText.replace(replacePattern, '<img src="$1">');
        return replacedText;
    }
    
    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
}

function displayTime(timestamp) {
    var str = "";

    var currentTime = new Date(timestamp)
    var hours = currentTime.getHours()
    var minutes = currentTime.getMinutes()

    if (minutes < 10) {
        minutes = "0" + minutes
    }

    str += '<em>'+hours + ":" + minutes + " ";
    if(hours > 11){
        str += "PM </em>"
    } else {
        str += "AM </em>"
    }
    return str;
}

filepicker.setKey('AO3aY4NHT1WRKxNo1mKR0z');   
$('#filepicker').change(function() {
    var url = $('#filepicker').val()
    messagesRef.push({name:name, text:url+'+name.jpg', timestamp: $.now() });
    $('#filepicker').val('')
});

var addEvent = function addEvent(element, eventName, func) {
	if (element.addEventListener) {
    	return element.addEventListener(eventName, func, false);
    } else if (element.attachEvent) {
        return element.attachEvent("on" + eventName, func);
    }
};

addEvent(document.getElementById('open-left'), 'click', function(){
	snapper.open('left');
});

/* Prevent Safari opening links when viewing as a Mobile App */
(function (a, b, c) {
    if(c in b && b[c]) {
        var d, e = a.location,
            f = /^(a|html)$/i;
        a.addEventListener("click", function (a) {
            d = a.target;
            while(!f.test(d.nodeName)) d = d.parentNode;
            "href" in d && (d.href.indexOf("http") || ~d.href.indexOf(e.host)) && (a.preventDefault(), e.href = d.href)
        }, !1)
    }
})(document, window.navigator, "standalone");
