
/**
 * @author Matthias Lohr <matthias@lohr.me>
 */

// settings
var myPeerApiKey = 'byzn0pwgnt2csor';

// brain
var peer = null;
var conn = null;
var challenger = null;
var game = null;

/**
 * @return {undefined}
 */
var PeerChessGame = function() {
	// declaration stuff
	this.chessLetter2Number = function(letter) {
		switch (letter) {
			case "a": return 1;
			case "b": return 2;
			case "c": return 3;
			case "d": return 4;
			case "e": return 5;
			case "f": return 6;
			case "g": return 7;
			case "h": return 8;
			default: return undefined;
		}
	}

	this.chessNumber2Letter = function(number) {
		switch(number) {
			case 1: return 'a';
			case 2: return 'b';
			case 3: return 'c';
			case 4: return 'd';
			case 5: return 'e';
			case 6: return 'f';
			case 7: return 'g';
			case 8: return 'h';
			default: return undefined;
		}
	}

	this.chessPosition2TopLeftPair = function(chessPosition) {
		tmp = {};
		tmp.top = ((8-parseInt(chessPosition.charAt(1)))*12.5)+'%';
		tmp.left = ((this.chessLetter2Number(chessPosition.charAt(0))-1)*12.5)+'%';
		return tmp;
	}

	this.createFigure = function(color, type, chessPosition) {
		var template = $('<div class="figure" style="display: none;"></div>');
		template.addClass(this.getClassName(color, type));
		template.attr('data-color', color);
		template.attr('data-type', type);
		template.attr('data-chess-position', chessPosition);
		template.css(this.chessPosition2TopLeftPair(chessPosition));
		$('#fields').append(template);
		template.fadeIn();
	}

	this.getClassName = function(color, type) {
		return color+'-'+type;
	}

	this.onClick = function(chessPosition) {
		var element = $('#fields div.figure[data-chess-position="'+chessPosition+'"]');
		if (element.length != 1) return false;

	}

	// set default figures
	this.createFigure('white', 'rook', 'a1');
	this.createFigure('white', 'knight', 'b1');
	this.createFigure('white', 'bishop', 'c1');
	this.createFigure('white', 'queen', 'd1');
	this.createFigure('white', 'king', 'e1');
	this.createFigure('white', 'bishop', 'f1');
	this.createFigure('white', 'knight', 'g1');
	this.createFigure('white', 'rook', 'h1');
	this.createFigure('black', 'rook', 'a8');
	this.createFigure('black', 'knight', 'b8');
	this.createFigure('black', 'bishop', 'c8');
	this.createFigure('black', 'queen', 'd8');
	this.createFigure('black', 'king', 'e8');
	this.createFigure('black', 'bishop', 'f8');
	this.createFigure('black', 'knight', 'g8');
	this.createFigure('black', 'rook', 'h8');
	for (i = 1; i <= 8; i++) {
		this.createFigure('white', 'pawn', this.chessNumber2Letter(i)+'2');
		this.createFigure('black', 'pawn', this.chessNumber2Letter(i)+'7');
	}
}



var PeerChessFigure = function(color, type) {

}

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
	// init game
	game = new PeerChessGame();

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

function shutdownGame(reason) {
	location.reload();
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
			connection.on('close', function() {
				shutdownGame();
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
					connection.on('close', function() {
						shutdownGame();
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

	$('#fields').bind('click', function(event) {
		var posX = event.pageX - $(this).position().left;
		var posY = event.pageY - $(this).position().top;
		var fieldX = game.chessNumber2Letter(Math.ceil(posX*8/$(this).width()));
		var fieldY = 9-Math.ceil(posY*8/$(this).height());
		var chessPosition = fieldX+fieldY;
		// raise event
		if (game !== null) game.onClick(chessPosition);
	})
});


