

var hash = window.location.hash,
    url = "https://purcellchat.firebaseIO.com/",
    hash = hash.substr(1,hash.length),
    new_room = false;
    
if (hash === ""){
    hash = window.location.hash = Math.random().toString(36).substr(5);
    new_room = true;
}

var name = $.cookie(hash+'name');
if(name == "undefined") { 
    var name = prompt("Your name?", "Visitor");
    $.cookie(hash+'name', name,{expires: 365});
}
$('#roomName').text(hash);
$('#messageWrap').height( $(window).height()-($('#chatWrap').height()+$('#toolbar').height()) );


    currentStatus = "",
    userListRef = new Firebase(url+hash+"/userlist"),
    myUserRef = userListRef.push(),
    connectedRef = new Firebase(url+".info/connected"),
    messagesRef = new Firebase(url+hash+"/chats"),
    imageRef = new Firebase(url+hash+"/images")
    startsession = $.now();
    

    pingsound = new Audio("SONAR.WAV"); // buffers automatically when created

$(document).ready(function(){
    
    online();
    watchInput();
    messages();
    images();
});
$(window).on('hashchange', function() {
    online();
    watchInput();
    messages();
    images();

});
function notications(from,text) {
    pingsound.play();
      if (window.webkitNotifications.checkPermission() == 0) { // 0 is PERMISSION_ALLOWED
        // function defined in step 2
        notification_test = window.webkitNotifications.createNotification(
          'img/icon.png', from, text);
        //notification_test.ondisplay = function() { ... do something ... };
        //notification_test.onclose = function() { ... do something else ... };
        notification_test.show();
      } else {
        window.webkitNotifications.requestPermission();
      }
}
function online() {
    connectedRef.on("value", function(isOnline) {
      if (isOnline.val()) {
        myUserRef.onDisconnect().remove();
        setUserStatus("");
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
      if(user.name != name){
          notications(user.name, 'is online')
      }
    });

    userListRef.on("child_removed", function(snapshot) {
      $("#" + snapshot.name()).remove();
    });

    userListRef.on("child_changed", function(snapshot) {
      var user = snapshot.val();
      $("#" + snapshot.name()).text(user.name + " " + user.status);
    });

    document.onIdle = function () {
      setUserStatus("(Idle)");
    }
    document.onAway = function () {
      setUserStatus("(Away)");
    }
    document.onBack = function (isIdle, isAway) {
      setUserStatus("");
    }

    setIdleTimeout(10000);
    setAwayTimeout(60000);
        
}
function watchInput(){
    // When the user presses enter on the message input, write the message to firebase.
    $('#messageInput').keypress(function (e) {
      if (e.keyCode == 13) {
        var text = $('#messageInput').val();

        replacePattern = /(https?:\/\/.*\.(?:png|jpg|gif|jpeg))/i;
        var replaced = text.search(replacePattern) >= 0;
        if(replaced)
            imageRef.push({name:name, image:text, timestamp: $.now() });
        else 
            messagesRef.push({name:name, text:text.replace(/^\s\s*/, '').replace(/\s\s*$/, '').replace(/\r?\n/g, '<br />'), timestamp: $.now() });   
        

        
        $('#messageInput').val('');
      }
    });
}
function messages(){
    
    
    messagesRef.limit(50).on('child_added', function (snapshot) {
      var message = snapshot.val();
    
      var cont = $('<div/>').attr('class','messageDiv');
      $('<span/>').addClass('nameCol').text(message.name).appendTo(cont);
      $('<span/>').addClass('msgCol').html(parseText(message.text)).appendTo(cont);
      $('<span/>').addClass('dateCol').html(displayTime(message.timestamp)).appendTo(cont);
      $('<hr/>').addClass('clear').appendTo(cont);
      cont.appendTo('#messageWrap');
      document.title = message.text.substring(0,15) + '...'
      if(message.name != name){
          notications(message.name, message.text)
      }
      $('#messageWrap').scrollTop($('#messageWrap')[0].scrollHeight);
    });
    
    
    $('#messageWrap').scrollTop($('#messageWrap')[0].scrollHeight);

    
}
function images(){
    var limits = 50;

    // Add a callback that is triggered for each chat message.
    imageRef.limit(limits).on('child_added', function (snapshot) {
      var message = snapshot.val();
  
      var cont = $('<div/>').attr('class','imageDiv');
      $('<p/>').text(message.name).appendTo(cont);
      $('<img/>').attr('src',message.image ).attr('width',250).appendTo(cont);
      cont.appendTo('#imgWrap');
      
      $('#imgWrap').height( $(window).height()-($('#chatWrap').height()+$('#toolbar').height()) );
      $('#imgWrap').scrollTop($('#imgWrap')[0].scrollHeight);
    });
    
    $('#imgWrap').scrollTop($('#imgWrap')[0].scrollHeight);
    
}
function changeTitle(text) {
    console.log(text)
    var internalHandle = null;
    intervalHandle = setInterval(function() {
            if (document.title == hash) {

                console.log('if 1')
                document.title = text.substring(0,15) + '...'
            } else {

                console.log('if 2')
               document.title = 'Simplachat';
            }    
        }, 5000);
}

function parseText(inputText) {
    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    replacePattern = /(https?:\/\/.*\.(?:png|jpg|gif|jpeg))/i;
    
    var replaced = inputText.search(replacePattern) >= 0;
    if(replaced){
        replacedText = inputText.replace(replacePattern, '<img src="$1" width="400">');
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

    str += '<em>'+hours + ":" + minutes + "</em>";

    return str;
}



if(jQuery.browser.mobile) {

    $('body').addClass('mobile');

    var snapper = new Snap({
        element: document.getElementById('content')
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
    $('#filepicker').hide();
    
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
    
} else {

    var imageRef = new Firebase(url+hash+"/images");
    
    filepicker.setKey('AO3aY4NHT1WRKxNo1mKR0z');   
    $('#filepicker').change(function() {
        var url = $('#filepicker').val()
        imageRef.push({name:name, image:url+'+name.jpg', timestamp: $.now() });
        $('#filepicker').val('')
    });
    
    $('body').addClass('desktop');
    $('#open-left').hide();
}
