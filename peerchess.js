
/**
 * @author Matthias Lohr <matthias@lohr.me>
 */

// settings
var myPeerApiKey = 'byzn0pwgnt2csor';

/**********************************************************************************************************************/
// brain

var GAME_STATUS_LOADING = 1; // loading/initializing and connecting to peer server
var GAME_STATUS_INITIALIZED = 2; // waiting for remote connection
var GAME_STATUS_RUNNING = 3; // active game
var GAME_STATUS_FINISHED = 4;

var PeerChessGame = Class.create({
	initialize: function(options, callbacks) {
		this.callbacks = callbacks;
		this.gameStatus = GAME_STATUS_LOADING;
		this.peer = new Peer({
			'key': options.peerApiKey,
			'debug': true
		});
		this.connection = null;
		this.myColor = null;
		this.turn = 'white';
		var that = this;
		this.peer.on('open', function(peerId) {
			that.gameStatus = GAME_STATUS_INITIALIZED;
			that.executeCallback('onInitialized', {'peerId': peerId});
		});
		this.peer.on('close', function() {

		});
		this.peer.on('error', function (error) {

		});
		this.peer.on('connection', function(connection) {
			connection.on('open', function() {
				if (that.gameStatus == GAME_STATUS_INITIALIZED) {
					// that.peer.disconnect(); // TODO waiting for implementation of this function
					that.gameStatus = GAME_STATUS_RUNNING;
					that.connection = connection;
					that.executeCallback('onConnected');
					that.initGameBoard('black');
					that.executeCallback('onNotice', {message: 'You challenged the other player, so you\'re playing with <strong>black</strong>!'});
					that.connection.on('data', function(data) {
						that.parseIncomingData(data);
					});
				}
			});
		});
	},

	connectToPeer: function(peerId) {
		if (this.gameStatus !== GAME_STATUS_INITIALIZED) return false;
		var connection = this.peer.connect(peerId);
		var that = this;
		connection.on('open', function() {
			if (that.gameStatus == GAME_STATUS_INITIALIZED) {
				// that.peer.disconnect(); // TODO waiting for implementation of this function
				that.gameStatus = GAME_STATUS_RUNNING;
				that.connection = connection;
				that.executeCallback('onConnected');
				that.initGameBoard('white');
				that.executeCallback('onNotice', {message: 'You has been challenged, so you\'re playing with <strong>white</strong>!'});
				that.executeCallback('onNotice', {message: 'Come on, make your first move!'});
				that.connection.on('data', function(data) {
					that.parseIncomingData(data);
				});
			}
		});

	},

	executeCallback: function(callbackName, options) {
		if (this.callbacks[callbackName] === undefined) return undefined;
		return this.callbacks[callbackName].call(this, options);
	},

	figureAdd: function(color, type, position) {
		this.field[position.posX][position.posY] = new type(color);
		this.executeCallback('onFigureAdd', {figure: this.field[position.posX][position.posY], position: position});
		return true;
	},

	getFigureAt: function(x, y) {
		return this.field[x][y];
	},

	getGameStatus: function() {
		return this.gameStatus;
	},

	getMyColor: function() {
		return this.myColor;
	},

	getTurnColor: function() {
		return this.turn;
	},

	initGameBoard: function(myColor) {
		this.myColor = myColor;
		this.field = new Array(8);
		for (i = 0; i <= 7; i++) this.field[i] = new Array(8);
		this.figureAdd('white', RookFigure,   {posX: 0, posY: 0});
		this.figureAdd('white', KnightFigure, {posX: 1, posY: 0});
		this.figureAdd('white', BishopFigure, {posX: 2, posY: 0});
		this.figureAdd('white', QueenFigure,  {posX: 3, posY: 0});
		this.figureAdd('white', KingFigure,   {posX: 4, posY: 0});
		this.figureAdd('white', BishopFigure, {posX: 5, posY: 0});
		this.figureAdd('white', KnightFigure, {posX: 6, posY: 0});
		this.figureAdd('white', RookFigure,   {posX: 7, posY: 0});
		this.figureAdd('black', RookFigure,   {posX: 0, posY: 7});
		this.figureAdd('black', KnightFigure, {posX: 1, posY: 7});
		this.figureAdd('black', BishopFigure, {posX: 2, posY: 7});
		this.figureAdd('black', QueenFigure,  {posX: 3, posY: 7});
		this.figureAdd('black', KingFigure,   {posX: 4, posY: 7});
		this.figureAdd('black', BishopFigure, {posX: 5, posY: 7});
		this.figureAdd('black', KnightFigure, {posX: 6, posY: 7});
		this.figureAdd('black', RookFigure,   {posX: 7, posY: 7});
		for (x = 0; x <= 7; x++) {
			this.figureAdd('white', PawnFigure,   {posX: x, posY: 1});
			this.figureAdd('black', PawnFigure,   {posX: x, posY: 6});
		}
	},

	move: function(src, dst) {
		var figure = this.getFigureAt(src.posX, src.posY);
		if (figure === undefined) return false;
		var dstFigure = this.getFigureAt(dst.posX, dst.posY);
		if (dstFigure !== undefined && dstFigure.getColor() == figure.getColor()) return false;
		if (!figure.validateMove(src, dst, this.field)) return false;
		// update field
		this.field[dst.posX][dst.posY] = figure;
		this.field[src.posX][src.posY] = undefined;
		if (dstFigure !== undefined) this.executeCallback('onFigureRemove', {
			figure: dstFigure,
			position: dst
		});
		this.executeCallback('onFigureMove', {
			figure: figure,
			src: src,
			dst: dst
		});
	},

	onTurn: function() {
	  return (this.getMyColor() == this.getTurnColor());
	},

	parseIncomingData: function(data) {
		// parse string
		var index = data.indexOf(' ');
		if (index <= 0) return false;
		var dataType = data.substr(0, index);
		var dataContent = data.substr(index+1);
		switch (dataType) {
			case "MOVE":
				// TODO implement
				break;
			case "PRIVMSG":
				this.executeCallback('onChatMessage', {'message': dataContent});
				break;
		}
	},

	sendChatMessage: function(text) {
		return this.sendData('PRIVMSG', text);
	},

	sendData: function(type, data) {
		return this.connection.send(type+' '+data);
	}
});

var PeerChessFigure = Class.create({
	initialize: function(color, type) {
		this.color = color;
		this.type = type;
	},

	getColor: function() {
		return this.color;
	},

	getType: function() {
		return this.type;
	},

	validateMove: function(src, dst, field) {
		return true; // TODO set to false! must me overwritten by child classes
	}
});

var KingFigure = Class.create(PeerChessFigure, {
	initialize: function($super, color) {
		$super(color, 'king');
	}
});

var QueenFigure = Class.create(PeerChessFigure, {
	initialize: function($super, color) {
		$super(color, 'queen');
	}
});

var RookFigure = Class.create(PeerChessFigure, {
	initialize: function($super, color) {
		$super(color, 'rook');
	}
});

var KnightFigure = Class.create(PeerChessFigure, {
	initialize: function($super, color) {
		$super(color, 'knight');
	}
});

var BishopFigure = Class.create(PeerChessFigure, {
	initialize: function($super, color) {
		$super(color, 'bishop');
	}
});

var PawnFigure = Class.create(PeerChessFigure, {
	initialize: function($super, color) {
		$super(color, 'pawn');
	}
});

// prototype extension

Element.prototype.fullPositionedOffset = function() {
	var offset = this.positionedOffset();
	var parent = this.getOffsetParent();
	if (parent && parent != this) {
		var tmp = parent.fullPositionedOffset();
		offset[0] += tmp[0];
		offset[1] += tmp[1];
		offset['top'] += tmp['top'];
		offset['left'] += tmp['left'];
	}
	return offset;
}

// interaction stuff
document.observe("dom:loaded", function() {
	// init game
	var game = new PeerChessGame({
		peerApiKey: myPeerApiKey
	}, {
		onInitialized: function(data) {
			$('local-id').update(data.peerId);
		},
		onConnected: function() {
			$('connection-dialog').hide();
			$('game').show();
			$('chat-write-message').focus();
		},
		onChatMessage: function(data) {
			var template = new Element('p',{
				class: 'message-type-opponent'
			});
			template.update('<strong>Opponent: </strong><span></span>');
			template.down('span').update(data.message.escapeHTML());
			$('messages').appendChild(template);
		},
		onNotice: function(data) {
			var template = new Element('p',{
				class: 'message-type-notice'
			});
			template.update('<span></span>');
			template.down('span').update(data.message);
			$('messages').appendChild(template);
		},
		onFigureAdd: function(data) {
			// create element
			var template = new Element('div', {
				class: 'figure',
				'data-color': data.figure.getColor(),
				'data-type': data.figure.getType(),
				'data-position-x': data.position.posX,
				'data-position-y': data.position.posY,
				'style': 'position: absolute; display: none; z-index: 0;',
				title: data.figure.getColor()+' '+data.figure.getType()
			});
			// show figure
			$('fields').appendChild(template);
			Effect.Appear(template);
		},
		onFigureMove: function(data) {
			var figure = $$('#fields .figure[data-position=x"'+data.src.posX+'"][data-position-y="'+data.src.posY+'"]').first();
			figure.setAttribute('data-position-x', data.dst.posX);
			figure.setAttribute('data-position-y', data.dst.posY);
		},
		onFigureRemove: function(data) {
			var figure = $$('#fields .figure[data-position=x"'+data.position.posX+'"][data-position-y="'+data.position.posY+'"]').first();
			Effect.Fade(figure);
			figure.remove();
		}
	});

	function resetFigureSelection() {
		var selected = $$('#fields .figure.selected');
		for (i = 0; i < selected.length; i++) {
			selected[i].removeClassName('selected');
		}
	}

	function selectFigureAt(x, y) {
		resetFigureSelection();
		$$('#fields .figure[data-position-x="'+x+'"][data-position-y="'+y+'"]').first().addClassName('selected');
	}

	function getSelectedPosition() {
		var selected = $$('#fields .figure.selected')
		if (selected.length == 0) return null;
		return {posX: selected.first().getAttribute('data-position-x'), posY: selected.first().getAttribute('data-position-y')};
	}

	$('remote-id').observe('keyup', function(event) {
		if (event.keyCode == 13) {
			game.connectToPeer($('remote-id').getValue());
		}
	});

	$('chat-write-message').observe('keyup', function(event) {
		if (event.keyCode == 13) {
			var message = $('chat-write-message').getValue().trim();
			if (message.length > 0) {
				game.sendChatMessage(message);
				var template = new Element('p',{
					class: 'message-type-me'
				});
				template.update('<strong>You: </strong><span></span>');
				template.down('span').update(message.escapeHTML());
				$('messages').appendChild(template);
			}
			$('chat-write-message').setValue('');
		}
	});

	$('fields').observe('click', function(event) {
		if (!game.onTurn()) return;
		// calculate relative click position
		var relativeX = event.pageX - this.fullPositionedOffset()[0];
		var relativeY = event.pageY - this.fullPositionedOffset()[1];
		var fieldX = Math.floor(8*relativeX/this.getWidth());
		var fieldY = 7-Math.floor(8*relativeY/this.getHeight());
		var figure = game.getFigureAt(fieldX, fieldY);
		// select? move?
		if (figure !== undefined && figure.getColor() == game.getMyColor()) {
			selectFigureAt(fieldX, fieldY);
		}
		else if (getSelectedPosition() !== null) {
			game.move(getSelectedPosition(), {posX: fieldX, posY: fieldY});
			resetFigureSelection();
		}
	});
});
