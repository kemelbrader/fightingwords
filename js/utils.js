
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
            ? args[number]
            : match
        ;
        });
    };
}

Handlebars.registerHelper("foreach",function(arr,options) {
	if (options.inverse && !arr.length) {
		return options.inverse(this);
	}
 
	return arr.map(function(item,index) {
  		if (typeof item === 'string') {
			var item = new String(item);
		}
 
		item.$index = index;
		item.$first = index === 0;
		item.$last  = index === arr.length-1;
		return options.fn(item);
	}).join('');
});