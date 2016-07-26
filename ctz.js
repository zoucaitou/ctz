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
		description : '类backbone框架,集成简易模块化功能',
		time 		: '2013-11-07 15:09:45'
	};

	// Fix
	if (typeof Object.create !== "function") {
		Object.create = function(o) {
			function F() {}
			F.prototype = o;
			return new F();
		};
	}


	// Require
	var objproto = Object.prototype,
		objtoString   = objproto.toString,
		arrproto      = Array.prototype,
		nativeForEach = arrproto.forEach,
		modules       = {},
		pushStack     = {};

	function each(obj, callback, context) {
		if (obj == null) return;
		//如果支持本地forEach方法,并且是函数
		if (nativeForEach && obj.forEach === nativeForEach) {
			obj.forEach(callback, context);
		} else if (obj.length === +obj.length) {
			//for循环迭代
			for (var i = 0, l = obj.length; i < l; i++) {
				if (callback.call(context, obj[i], i, obj) === breaker) return;
			}
		}
	};

	function isFunction(it) {
		return objtoString.call(it) === '[object Function]';
	}

	function isArray(it) {
		return objtoString.call(it) === '[object Array]';
	}

	//导入模块
	var exp = {
		require: function(id, callback) {
			//数组形式
			//require(['domReady', 'App'], function(domReady, app) {});
			if (isArray(id)) {
				if (id.length > 1) {
					return makeRequire(id, callback);
				}
				id = id[0];
			}

			if (!modules[id]) {
				throw "module " + id + " not found";
			}

			if (callback) {
				var module = build(modules[id]);
				callback(module)
				return module;
			} else {
				if (modules[id].factory) {
					return build(modules[id]);
				}
				return modules[id].exports;
			}
		},
		//定义模块
		define: function(id, deps, factory, post) { //模块名,依赖列表,模块本身
			if (modules[id]) {
				throw "module " + id + " 模块已存在!";
			}
			//存在依赖导入
			if (arguments.length > 2) {
				modules[id] = {
					id: id,
					deps: deps,
					factory: factory
				};
				//后加载
				post && exp.require(id, function(exp) {
					post(exp)
				})
			} else {
				factory = deps;
				modules[id] = {
					id: id,
					factory: factory
				};
			}
		}
	}

	//解析依赖关系
	function parseDeps(module) {
		var deps = module['deps'],
			temp = [];
		each(deps, function(id, index) {
			temp.push(build(modules[id]))
		})
		return temp;
	}

	function build(module) {

		if (module === undefined) return;

		var depsList, existMod,
			factory = module['factory'],
			id = module['id'];

		if (existMod = pushStack[id]) { //去重复执行
			return existMod;
		}

		//接口点，将数据或方法定义在其上则将其暴露给外部调用。
		module.exports = {};

		//去重
		delete module.factory;

		if (module['deps']) {
			//依赖数组列表
			depsList = parseDeps(module);
			module.exports = factory.apply(module, depsList);
		} else {
			// exports 支持直接 return 或 modulejs.exports 方式
			module.exports = factory(exp.require, module.exports, module) || module.exports;
		}

		pushStack[id] = module.exports;

		return module.exports;
	}

	//解析require模块
	function makeRequire(ids, callback) {
		var r = ids.length,
			shim = {};
		each(ids, function(name) {
			shim[name] = build(modules[name])
		})
		if (callback) {
			callback.call(null, shim);
		} else {
			shim = null;
		}
	}

	var use = ctz.Use = exp.require;
	var register = ctz.Register = exp.define;


	// Ajax
	var Ajax = ctz.Ajax = {
	}

	Ajax.get = function(url, callback) {
		$.get(url, callback);
	}

	Ajax.post = function(url, data, callback) {
		$.post(url, data, callback);
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

	// observe 监听数据变动
	;(function (win) {
    var observe = function (target, arr, callback) {
      var _observe = function (target, arr, callback) {
          if (!target.$observer) target.$observer = this;
          var $observer = target.$observer;
          var eventPropArr = [];
          if (observe.isArray(target)) {
              if (target.length === 0) {
                  target.$observeProps = {};
                  target.$observeProps.$observerPath = "#";
              }
              $observer.mock(target);

          }
          for (var prop in target) {
              if (target.hasOwnProperty(prop)) {
                  if (callback) {
                      if (observe.isArray(arr) && observe.isInArray(arr, prop)) {
                          eventPropArr.push(prop);
                          $observer.watch(target, prop);
                      } else if (observe.isString(arr) && prop == arr) {
                          eventPropArr.push(prop);
                          $observer.watch(target, prop);
                      }
                  } else {
                      eventPropArr.push(prop);
                      $observer.watch(target, prop);
                  }
              }
          }
          $observer.target = target;
          if (!$observer.propertyChangedHandler) $observer.propertyChangedHandler = [];
          var propChanged = callback ? callback : arr;
          $observer.propertyChangedHandler.push({ all: !callback, propChanged: propChanged, eventPropArr: eventPropArr });
      }
      _observe.prototype = {
          "onPropertyChanged": function (prop, value, oldValue, target, path) {
              if (value !== oldValue && this.propertyChangedHandler) {
                  var rootName = observe._getRootName(prop, path);
                  for (var i = 0, len = this.propertyChangedHandler.length; i < len; i++) {
                      var handler = this.propertyChangedHandler[i];
                      if (handler.all || observe.isInArray(handler.eventPropArr, rootName) || rootName.indexOf("Array-") === 0) {
                          handler.propChanged.call(this.target, prop, value, oldValue, path);
                      }
                  }
              }
              if (prop.indexOf("Array-") !== 0 && typeof value === "object") {
                  this.watch(target, prop, target.$observeProps.$observerPath);
              }
          },
          "mock": function (target) {
              var self = this;
              observe.methods.forEach(function (item) {
                  target[item] = function () {
                      var old = Array.prototype.slice.call(this, 0);
                      var result = Array.prototype[item].apply(this, Array.prototype.slice.call(arguments));
                      if (new RegExp("\\b" + item + "\\b").test(observe.triggerStr)) {
                          for (var cprop in this) {
                              if (this.hasOwnProperty(cprop) && !observe.isFunction(this[cprop])) {
                                  self.watch(this, cprop, this.$observeProps.$observerPath);
                              }
                          }
                          //todo
                          self.onPropertyChanged("Array-" + item, this, old, this, this.$observeProps.$observerPath);
                      }
                      return result;
                  };
                  target['real'+item.substring(0,1).toUpperCase()+item.substring(1)] = function () {
                      return Array.prototype[item].apply(this, Array.prototype.slice.call(arguments));
                  };
              });
          },
          "watch": function (target, prop, path) {
              if (prop === "$observeProps" || prop === "$observer") return;
              if (observe.isFunction(target[prop])) return;
              if (!target.$observeProps) target.$observeProps = {};
              if (path !== undefined) {
                  target.$observeProps.$observerPath = path;
              } else {
                  target.$observeProps.$observerPath = "#";
              }
              var self = this;
              var currentValue = target.$observeProps[prop] = target[prop];
              Object.defineProperty(target, prop, {
                  get: function () {
                      return this.$observeProps[prop];
                  },
                  set: function (value) {
                      var old = this.$observeProps[prop];
                      this.$observeProps[prop] = value;
                      self.onPropertyChanged(prop, value, old, this, target.$observeProps.$observerPath);
                  }
              });
              if (typeof currentValue == "object") {
                  if (observe.isArray(currentValue)) {
                      this.mock(currentValue);
                      if (currentValue.length === 0) {
                          if (!currentValue.$observeProps) currentValue.$observeProps = {};
                          if (path !== undefined) {
                              currentValue.$observeProps.$observerPath = path;
                          } else {
                              currentValue.$observeProps.$observerPath = "#";
                          }
                      }
                  }
                  for (var cprop in currentValue) {
                      if (currentValue.hasOwnProperty(cprop)) {
                          this.watch(currentValue, cprop, target.$observeProps.$observerPath + "-" + prop);
                      }
                  }
              }
          }
      }
      return new _observe(target, arr, callback)
    }
    observe.methods = ["concat", "copyWithin", "entries", "every", "fill", "filter", "find", "findIndex", "forEach", "includes", "indexOf", "join", "keys", "lastIndexOf", "map", "pop", "push", "reduce", "reduceRight", "reverse", "shift", "slice", "some", "sort", "splice", "toLocaleString", "toString", "unshift", "values", "size"]
    observe.triggerStr = ["concat", "copyWithin", "fill", "pop", "push", "reverse", "shift", "sort", "splice", "unshift", "size"].join(",")
    observe.isArray = function (obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    }
    observe.isString = function (obj) {
      return typeof obj === "string";
    }
    observe.isInArray = function (arr, item) {
      for (var i = arr.length; --i > -1;) {
          if (item === arr[i]) return true;
      }
      return false;
    }
    observe.isFunction = function (obj) {
      return Object.prototype.toString.call(obj) == '[object Function]';
    }
    observe._getRootName = function (prop, path) {
      if (path === "#") {
          return prop;
      }
      return path.split("-")[1];
    }

    observe.add = function (obj, prop, value) {
      obj[prop] = value;
      var $observer = obj.$observer;
      $observer.watch(obj, prop);
    }
    Array.prototype.size = function (length) {
      this.length = length;
    }

    if (typeof module != 'undefined' && module.exports && this.module !== module) { module.exports = observe }
    else if (typeof define === 'function' && define.amd) { define(ctz.observe) }
	  else { ctz.observe = observe };
	})(Function('return this')());

	return ctz;
}(window, jQuery));
