
/**
 * @author Matthias Lohr <matthias@lohr.me>
 */

Effect.Animate = Class.create(Effect.Base, {
	initialize: function(element) {
		this.properties = new Object();
		this.element = element;
		for (p in arguments[1].properties) {
			this.properties[p] = {};
			var property = this.properties[p];
			if (element.getStyle(p)) {
				property.oldValue = parseFloat(element.getStyle(p));
			}
			else {
				property.oldValue = parseFloat(arguments[1].properties[p]);
			}
			property.newValue = parseFloat(arguments[1].properties[p]);
			property.unit = (new String(arguments[1].properties[p])).substr((new String(property.newValue)).length);
		}
		this.start();
	},

	setup: function() {
		//this.element.makePositioned();
	},

	update: function(position) {
		var styles = {};
		for (p in this.properties) {
			var property = this.properties[p];
			var value = property.oldValue*(1.0-position)+property.newValue*position;
			styles[p] = value+property.unit;
		}
		this.element.setStyle(styles);
	}
});
