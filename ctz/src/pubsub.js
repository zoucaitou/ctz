var PubSub = ctz.PubSub = {

	setup: function() {
		this.o = $({});
	},

	subscribe: function() {
		this.o.bind.apply(this.o, arguments);
	},

	publish: function() {
		this.o.trigger.apply(this.o, arguments);
	}

};