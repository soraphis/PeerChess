
/**
 * @author Matthias Lohr <matthias@lohr.me>
 */

// settings
var myPeerApiKey = 'byzn0pwgnt2csor';

/**********************************************************************************************************************/
// brain

var PeerChessGame = Class.create({
	initialize: function(options, callbacks) {
		this.callbacks = callbacks;
		this.peer = new Peer({
			'key': options.peerApiKey
		});
		var that = this;
		this.peer.on('open', function(peerId) {
			that.executeCallback('onInitialized', {'peerId': peerId});
		});
		this.peer.on('connection', function(connection) {

		});
	},

	executeCallback: function(callbackName, options) {
		if (this.callbacks[callbackName] === undefined) return undefined;
		return this.callbacks[callbackName].call(this, options);
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
	var game = new PeerChessGame({
		peerApiKey: myPeerApiKey
	}, {
		onInitialized: function(data) {
			$('local-id').update(data.peerId);
		}
	});
});
