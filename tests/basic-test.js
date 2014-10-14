var assert = require('assert'),
    templating = require('../lib/templating');

var asyncLongFunction = function(param, callback, context) {
	setTimeout(function() {
		callback.call(context, 'Return from long async function: ' + param);
	}, 1000);
};

var asyncShortFunction = function(param, callback, context) {
	setTimeout(function() {
		callback.call(context, 'Return from short async function: ' + param);
	}, 0);
};

var syncFunction = function(param) {
	return 'Return from sync function: ' + param;
};

var htmlD = '<div>';
htmlD += '<% data.templating.print("Simple print text") %>';
htmlD += '<p>';
htmlD += '<%= data.syncFunction("Sync test") %>';
htmlD += '</p>';
htmlD += '<p>';
htmlD += '<% data.asyncLongFunction("Async long test", data.templating.getRegisteredCallbackFunction(function(html) {';
htmlD += '%>';
htmlD += '<h1><%= html %></h1>';
htmlD += '<h2>';
htmlD += '<% data.asyncShortFunction("Async short test", data.templating.getRegisteredCallbackFunction(function(html) {';
htmlD += '%>';
htmlD += '<span><%= html %></span>';
htmlD += '<%';
htmlD += '})) %>';
htmlD += '</h2>';
htmlD += '<%';
htmlD += '})) %>';
htmlD += '</p>';
htmlD += '</div>';

var html = '<div>';
html += '<% templating.print("Simple print text") %>';
html += '<p>';
html += '<%= syncFunction("Sync test") %>';
html += '</p>';
html += '<p>';
html += '<% asyncLongFunction("Async long test", templating.getRegisteredCallbackFunction(function(html) {';
html += '%>';
html += '<h1><%= html %></h1>';
html += '<h2>';
html += '<% asyncShortFunction("Async short test", templating.getRegisteredCallbackFunction(function(html) {';
html += '%>';
html += '<span><%= html %></span>';
html += '<%';
html += '})) %>';
html += '</h2>';
html += '<%';
html += '})) %>';
html += '</p>';
html += '</div>';


var syncHTML = '<div><% data.templating.print(data.syncFunction("Sync test")) %></div>';
var resultSyncHTML = '<div>Return from sync function: Sync test</div>';

var resultHTML = '<div>Simple print text<p>Return from sync function: Sync test</p><p><h1>Return from long async function: Async long test</h1><h2><span>Return from short async function: Async short test</span></h2></p></div>';

var tmplInst = templating.getTemplatingInstance();
var template = tmplInst.template(syncHTML, null, {variable: 'data'});
var templateHTML = template({
	param: 'Test string',
	syncFunction: syncFunction,
	templating: tmplInst,
}, function(callbackHTML) {
		assert.equal(callbackHTML, resultSyncHTML);
	}
);

assert.equal(templateHTML, resultSyncHTML);

var template = tmplInst.template(htmlD, null, {variable: 'data'});
template({
	param: 'Test string',
	asyncLongFunction: asyncLongFunction,
	asyncShortFunction: asyncShortFunction,
	syncFunction: syncFunction,
	templating: tmplInst,
}, function(templateHTML) {
	assert.equal(resultHTML, templateHTML);

	var template = tmplInst.template(html, null);
	template({
		param: 'Test string',
		asyncLongFunction: asyncLongFunction,
		asyncShortFunction: asyncShortFunction,
		syncFunction: syncFunction,
		templating: tmplInst,
	}, function(templateHTML) {
		assert.equal(resultHTML, templateHTML);
	});

});