#Asynchronous template engine

##Installation

	npm install templating

##What it does

Templating is a underscore like template engine for NodeJS that supports asynchronous and synchronous calls. Nested calls (both types) are also possible. Works only on the server side javascript!  

##Usage

	var templating = require('templating');

Create an instance and pass the template code to it:

	var tmplInst = templating.getTemplatingInstance();
	var template = tmplInst.template(templateCode, null, {variable: 'data'});

For details how to use Underscore Template Engine look at Underscore documentation [http://underscorejs.org/#template](http://underscorejs.org/#template)

In the example here I use the namespace variable 'data' because it performs much better.


	var templateHTML = template({
		param: 'Test string',
		asyncLongFunction: asyncLongFunction,
		asyncShortFunction: asyncShortFunction,
		syncFunction: syncFunction,
		templating: tmplInst,
	}, function(callbackHTML) {
		console.log(callbackHTML);
	}, this);

Pass the template parameters and functions that you want to use in you template code. Pass also the templating instance if you want to use it in the template code.
Callback will be called when all the functions (sync and async) return and the callbackHTML is you parsed result code.
You may notice that the function also returns a templateHTML code as a result. It is the same like the callbackHTML if no asynchronous calls were made in the template code. But it there were some the templateHTML result will be invalid or incomplete. Then you should use the callbackHTML result.


##Template code
Template code works like undersore templates with one small difference: **print** function is now a member of the templating instance! So it is important to pass the templating instance as a paramater to use it.

	<%= data.variable %> - Prints the variable content
	<% data.templating.print(variable) %> - Prints the variable content

When using syncronous functions you can output the result directly.

Because of delayed output of asyncronous functions the template engine has to wait until the callback is called to process with the further operations. So you have to wrap you callback function in this code:

Instead of:

	asyncronousFunction(function(callbackResult) {
		... do something with the callbackResult ...
	})

Use

	asyncronousFunction(templating.getRegisteredCallbackFunction(function(callbackResult) {
		... do something with the callbackResult ...
	}))

That's all!

##Changelog
1.0.0 Initial version

1.0.1 Fixed typo in test script name
