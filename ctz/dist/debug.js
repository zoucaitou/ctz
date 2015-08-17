;(function(ctz) {

	if (typeof define === 'function' && define.amd) {

		// support AMD
		define("ctz", [], function() {
			return ctz;
		});
	} else {

		window.ctz = ctz;
	}

})(function(window, $, undefined) {

	if (window.ctz) {
		return;
	}

	var ctz = {

		version		: '0.0.1',
		author 		: 'zoucaitou',
		email  		: 'zoucaitou@outlook.com',
		description : 'Just to prove that their'
	};

	// Fix
	if (typeof Object.create !== "function") {
		Object.create = function(o) {
			function F() {}
			F.prototype = o;
			return new F();
		};
	}

	// Controller
	var Controller = ctz.Controller = {

	};

	Controller.create = function(includes) {

		var result = function() {

			this.initializer.apply(this, arguments);
			this.init.apply(this, arguments);
		};

		result.fn = result.prototype;
		result.fn.init = function() {};

		result.proxy = function(func) {
			return $.proxy(func, this);
		};
		result.fn.proxy = result.proxy;

		result.include = function(ob) {
			$.extend(this.fn, ob);
		};
		result.extend = function(ob) {
			$.extend(this, ob);
		};

		result.include({
			initializer: function(options) {
				this.options = options;
				for (var key in this.options)
					this[key] = this.options[key];

				if (this.events) this.delegateEvents();
				if (this.elements) this.refreshElements();
			},

			$: function(selector) {
				return $(selector, this.el);
			},

			refreshElements: function() {
				for (var key in this.elements) {
					this[this.elements[key]] = this.$(key);
				}
			},

			eventSplitter: /^(\w+)\s*(.*)$/,

			delegateEvents: function() {
				for (var key in this.events) {
					var methodName = this.events[key];
					var method = this.proxy(this[methodName]);
					var match = key.match(this.eventSplitter);
					var eventName = match[1],
						selector = match[2];
					if (selector === '') {
						this.el.bind(eventName, method);
					} else {
						this.el.delegate(selector, eventName, method);
					}
				}
			}
		});

		if (includes) result.include(includes);

		return result;
	};

	// Guid
	var Identity = ctz.Identity = {

	};

	Identity.guid = function() {

		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {

			var r = Math.random() * 16 | 0,
				v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		}).toUpperCase();
	};

	// Class
	var Klass = ctz.Klass = {

	};

	Klass = {

		init: function() {},

		prototype: {
			init: function() {}
		},

		create: function() {

			var object = Object.create(this);
			object.parent = this;
			object.init.apply(object, arguments);
			return object;
		},

		inst: function() {

			var instance = Object.create(this.prototype);
			instance.parent = this;
			instance.init.apply(instance, arguments);
			return instance;
		},

		proxy: function(func) {

			var thisObject = this;
			return (function() {
				return func.apply(thisObject, arguments);
			});
		},

		include: function(obj) {

			var included = obj.included || obj.setup;
			for (var i in obj)
				this.fn[i] = obj[i];
			if (included) included(this);
		},

		extend: function(obj) {

			var extended = obj.extended || obj.setup;
			for (var i in obj)
				this[i] = obj[i];
			if (extended) extended(this);
		}
	};

	Klass.fn = Klass.prototype;
	Klass.fn.proxy = Klass.proxy;

	// Pubsub
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

	// Relation
	var camelize = function(str) {
		var result = str;
		result = result.replace(/_+(.)?/g, function(match, chr) {
			return chr ? chr.toUpperCase() : '';
		});
		result = result.replace(/(^.)?/, function(match, chr) {
			return chr ? chr.toUpperCase() : '';
		});
		return result;
	};

	var singularize = function(str) {
		return (str.replace(/s$/, ''));
	};

	var classify = function(str) {
		var result = singularize(str);
		return camelize(result);
	};

	var underscore = function(str) {
		return str.replace(/::/g, '/')
			.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
			.replace(/([a-z\d])([A-Z])/g, '$1_$2')
			.replace(/-/g, '_')
			.toLowerCase();
	};

	var Relation = ctz.Relation = {

		belongsTo: function(to_model, path, options) {
			if (!options) options = {};

			var class_name = options.class_name || classify(to_model);
			var foreign_key = options.foreign_key || to_model + "_id";
			var primary_key = options.primary_key || "id";
			var model = function() {
				return (require(path))
			};

			this.attributes.push(foreign_key);

			this.fn["get" + class_name] = function() {
				return (this[foreign_key] && model().find(this[foreign_key]));
			};

			this.fn["set" + class_name] = function(value) {
				this[foreign_key] = value && value.id;
			};
		},

		hasMany: function(to_model, path, options) {
			if (!options) options = {};

			var class_name = options.class_name || classify(to_model);
			var foreign_key = options.foreign_key || underscore(this.className) + "_id";
			var primary_key = options.primary_key || "id";
			var model = function() {
				return (require(class_name))
			};

			this.fn["get" + class_name + "s"] = function() {
				return (model().findAllByAttribute(foreign_key, this[primary_key]));
			};

			this.fn["has" + class_name] = function(item) {
				var items = this["get" + class_name + "s"]();
				var item_ids = items.map(function(i) {
					return i.id
				});
				return (item_ids.include(item.id));
			};
		}
	};

	// Model
	var Model = Klass.create();
	Model.createSub = Model.create;
	Model.setup = function(name, atts) {
		var model = Model.createSub();
		if (name) model.name = name;
		if (atts) model.attributes = atts;
		return model;
	};

	Model.extend({
		init: function() {
			this.records = {};
			this.attributes = [];
		},

		find: function(id) {
			var record = this.records[id];
			if (!record) throw ("Unknown record");
			return record.dup();
		},

		exists: function(id) {
			try {
				return this.find(id);
			} catch (e) {
				return false;
			}
		},

		populate: function(values) {

			this.records = {};

			for (var i = 0, il = values.length; i < il; i++) {
				var record = this.inst(values[i]);
				record.newRecord = false;
				this.records[record.id] = record;
			}
		},

		select: function(callback) {
			var result = [];

			for (var key in this.records)
				if (callback(this.records[key]))
					result.push(this.records[key]);

			return this.dupArray(result);
		},

		findByAttribute: function(name, value) {
			for (var key in this.records)
				if (this.records[key][name] == value)
					return this.records[key].dup();
		},

		findAllByAttribute: function(name, value) {
			return (this.select(function(item) {
				return (item[name] == value);
			}));
		},

		each: function(callback) {
			for (var key in this.records) {
				callback(this.records[key]);
			}
		},

		all: function() {
			return this.dupArray(this.recordsValues());
		},

		first: function() {
			var record = this.recordsValues()[0];
			return (record && record.dup());
		},

		last: function() {
			var values = this.recordsValues()
			var record = values[values.length - 1];
			return (record && record.dup());
		},

		count: function() {
			return this.recordsValues().length;
		},

		deleteAll: function() {
			for (var key in this.records)
				delete this.records[key];
		},

		destroyAll: function() {
			for (var key in this.records)
				this.records[key].destroy();
		},

		update: function(id, atts) {
			this.find(id).updateAttributes(atts);
		},

		create: function(atts) {
			var record = this.inst(atts);
			record.save();
			return record;
		},

		destroy: function(id) {
			this.find(id).destroy();
		},

		// Private
		recordsValues: function() {
			var result = []
			for (var key in this.records)
				result.push(this.records[key])
			return result;
		},

		dupArray: function(array) {
			return array.map(function(item) {
				return item.dup();
			});
		}
	});

	Model.include({
		newRecord: true,

		init: function(atts) {
			if (atts) this.load(atts);
		},

		isNew: function() {
			return this.newRecord;
		},

		validate: function() {},

		load: function(attributes) {
			for (var name in attributes)
				this[name] = attributes[name];
		},

		attributes: function() {
			var result = {};
			for (var i in this.parent.attributes) {
				var attr = this.parent.attributes[i];
				result[attr] = this[attr];
			}
			result.id = this.id;
			return result;
		},

		eql: function(rec) {
			return (rec && rec.id === this.id &&
				rec.parent === this.parent);
		},

		save: function() {
			if (this.validate() == false) return false;
			this.publish("beforeSave");
			this.newRecord ? this.create() : this.update();
			this.publish("afterSave");
			this.publish("save");
		},

		updateAttribute: function(name, value) {
			this[name] = value;
			return this.save();
		},

		updateAttributes: function(attributes) {
			this.load(attributes);
			return this.save();
		},

		destroy: function() {
			this.publish("beforeDestroy");
			delete this.parent.records[this.id];
			this.publish("afterDestroy");
			this.publish("destroy");
		},

		dup: function() {
			return Object.create(this);
		},

		toJSON: function() {
			return (this.attributes());
		},

		update: function() {
			this.publish("beforeUpdate");
			this.parent.records[this.id] = this.dup();
			this.publish("afterUpdate");
			this.publish("update");
		},

		generateID: function() {
			return Identity.guid();
		},

		create: function() {
			this.publish("beforeCreate");
			if (!this.id) this.id = this.generateID();
			this.newRecord = false;
			this.parent.records[this.id] = this.dup();
			this.publish("afterCreate");
			this.publish("create");
		},

		publish: function(channel) {
			this.parent.publish(channel, this);
		}
	});

	Model.extend(Relation);
	Model.extend(PubSub);

	return ctz;

}(window, jQuery));