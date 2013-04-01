
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

	getGameStatus: function() {
		return this.gameStatus;
	},

	parseIncomingData: function(data) {

	}
});

var PeerChessFigure = Class.create({
	initialize: function(color, type) {
		this.element = new Element('div', {
			'class': 'figure',
			'data-color': color,
			'data-type': type
		});
	},

	getColor: function() {
		return this.element.getAttribute('data-color');
	},

	getElement: function() {
		return this.element;
	},

	getType: function() {
		return this.element.getAttribute('data-type');
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

// interaction stuff
document.observe("dom:loaded", function() {
	// init game
	var game = new PeerChessGame({
		peerApiKey: myPeerApiKey
	}, {
		onInitialized: function(data) {
			$('local-id').update(data.peerId);
		}
	});

	$('remote-id').observe('keyup', function(event) {
		if (event.keyCode == 13) {
			game.connectToPeer($('remote-id').getValue());
		}
	});
});
