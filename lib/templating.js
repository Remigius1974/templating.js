// When customizing `templateSettings`, if you don't want to define an
// interpolation, evaluation or escaping regex, we need one that is
// guaranteed not to match.
var noMatch = /(.)^/;

// Certain characters need to be escaped so that they can be put into a
// string literal.
var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
};

var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

var escapeChar = function(match) {
    return '\\' + escapes[match];
};

// ************************************************************************

var templating =  function(instancesCounter) {
    // By default, Underscore uses ERB-style template delimiters, change the
    // following template settings to use alternative delimiters.
    this.templateSettings = {
        evaluate    : /<%([\s\S]+?)%>/g,
        interpolate : /<%=([\s\S]+?)%>/g,
        escape      : /<%-([\s\S]+?)%>/g
    };

    this.__w = 0; // waiting async counter
    this.__r = ''; // source to return
    this.__c = instancesCounter;
    this.source = '';
    this.callbackCounter = 0;
};

templating.prototype.hasUnfinishedRequests = function() {
    return this.__w > 0;
};

templating.prototype.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
};

templating.prototype.defaults = function(obj) {
    if (!this.isObject(obj)) return obj;
    for (var i = 1, length = arguments.length; i < length; i++) {
        var source = arguments[i];
        for (var prop in source) {
            if (obj[prop] === void 0) obj[prop] = source[prop];
        }
    }
    return obj;
};

// JavaScript micro-templating, similar to John Resig's implementation.
// Underscore templating handles arbitrary delimiters, preserves whitespace,
// and correctly escapes quotes within interpolated code.
templating.prototype.template = function(text, data, settings) {
    settings = this.defaults({}, settings, this.templateSettings);

    this.callbackCounter = 0; // reset the counter on every new instance
    this.__w = 0;
    this.__r = '';
    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
        (settings.escape || noMatch).source,
        (settings.interpolate || noMatch).source,
        (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var that = this;
    this.source = "this.__p += '";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
        that.source += text.slice(index, offset).replace(escaper, escapeChar);
        index = offset + match.length;

        if (escape) {
            that.source += "'+\n((__t=(" + escape + "))==null?'':templating.escape(__t))+\n'";
        } else if (interpolate) {
            that.source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
        } else if (evaluate) {
            that.source += "';\n" + evaluate + "\nthis.__p+='";
        }

        // Adobe VMs need the match returned to produce the correct offest.
        return match;
    });
    this.source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) this.source = 'with(obj||{}){\n' + this.source + '}\n';

    this.__p = '';
    this.print=function(){
        this.__p += Array.prototype.join.call(arguments,'');
    };

    this.toRelease = [];
    this.getRegisteredCallbackFunction = function(callbackFnc) {
        var __r = '###ident' + this.callbackCounter + '_' + this.__c + '###';
        this.callbackCounter++;
        this.print(__r);
        this.__w++;
        this.toRelease.push(__r);

        var that = this;
        return function(resultCallback) {
            process.nextTick(function() {

                var __pt = that.__p;
                that.__p = '';
                callbackFnc.call(that, resultCallback);
                that.__p = __pt.replace(__r, that.__p);
                var idx = that.toRelease.indexOf(__r); 
                if (idx != -1) {
                    that.__w--;
                    that.toRelease.splice(idx, 1);
                }
                if (that.__w === 0) {
                    that.callback.call(that.context, that.__p);
                }
            });
        }

    };

    this.source = "var __t;" + this.source + 'return this.__p;\n';


    try {
        var render = Function(settings.variable || 'obj', this.source);
    } catch (e) {
        e.source = this.source;
        throw e;
    }

    var template = function(data, callback, context) {
        var __r = render.call(that, data);
        that.callback = callback;
        that.context = context;

        if (!that.hasUnfinishedRequests()) {
            if (callback) {
                callback.call(context, __r);
            }
            return __r;
        }
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    this.source = 'function(' + argument + '){\n' + this.source + '}';

    return template;
};

this.instancesCounter = 0;
exports.getTemplatingInstance = function() {
    this.instancesCounter++;
    return new templating(this.instancesCounter);
};