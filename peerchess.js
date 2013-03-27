
/**
 * @author Matthias Lohr <matthias@lohr.me>
 */

// settings
var myPeerApiKey = 'byzn0pwgnt2csor';

// brain
var peer = null;
var conn = null;
var challenger = null;

function chatAppendMyMessage(message) {
	var template = $('<p class="message-type-me"><strong>You: </strong><span></span></p>');
	template.find('span').text(message);
	$('#messages').append(template);
	chatScrollDown();
}

function chatAppendNotice(message) {
	var template = $('<p class="message-type-notice"></p>');
	template.html(message);
	$('#messages').append(template);
	chatScrollDown();
}

function chatAppendOpponentMessage(message) {
	var template = $('<p class="message-type-opponent"><strong>Opponent: </strong><span></span></p>');
	template.find('span').text(message);
	$('#messages').append(template);
	chatScrollDown();
}

function chatScrollDown() {
	$('#messages').stop().animate({ scrollTop: $("#messages")[0].scrollHeight }, 800);
}

function getGameRole() {
	return challenger;
}

function initGame() {
	$('#connection-dialog').hide();
	$('#game').show();
	// write some funny stuff...
	if (getGameRole()) {
		chatAppendNotice('You\'re the <strong>challenger</strong>, so you\'re playing with <strong>black</strong>!');
	}
	else {
		chatAppendNotice('You <strong>has been challenged</strong>, so you\'re playing with <strong>white</strong>!');
		chatAppendNotice('It\'s your turn! Make your first move!');
	}

}

function parseIncomingData(data) {
	// parse string
	var index = data.indexOf(' ');
	if (index <= 0) return false;
	var dataType = data.substr(0, index);
	var dataContent = data.substr(index+1);
	switch (dataType) {
		case "MOVE":
			break;
		case "PRIVMSG":
			chatAppendOpponentMessage(dataContent);
			break;
	}
}

function sendChatMessage(message) {
	chatAppendMyMessage(message);
	return sendData('PRIVMSG', message);
}

function sendData(type, data) {
	if (conn === null) return false;
	conn.send(type + ' ' + data);
	return true;
}

function setGameRole(role) {
	challenger = role;
	initGame();
}

$(document).ready(function() {
	peer = new Peer({key: myPeerApiKey, debug: true});
	peer.on('open', function (id) {
		$('#local-id').text(id);
	});

	peer.on('connection', function(connection) {
		if (getGameRole() === null) {
			setGameRole(false);
			conn = connection;
			connection.on('data', function(data) {
				parseIncomingData(data);
			});
		}
	});

	$('#remote-id').bind('keyup', function(event) {
		if (event.keyCode == 13) {
			var connection = peer.connect($('#remote-id').val());
			connection.on('open', function() {
				if (getGameRole() === null) {
					setGameRole(true);
					conn = connection;
					connection.on('data', function(data) {
						parseIncomingData(data);
					});
				}
			});
		}
	});

	$('#chat-write-message').bind('keyup', function(event) {
		if (event.keyCode == 13) {
			var message = $('#chat-write-message').val();
			$('#chat-write-message').val('');
			message = message.trim();
			if (message.length > 0) sendChatMessage(message);
		}
	});
});


