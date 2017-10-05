function DataManager(processArticles) {

    /* CONSTANTS */
    this.DATELENGTH = 3;
        
    /* PUBLIC */

    this.articles = {};
    this.articlesByDate = [];
    this.articlesByKey = [];
    this.initialize = function() {
        $.get(metadataEndpoint, processArticleListData);
    }

    /* PRIVATE */

    var that = this;
    var processArticles = processArticles;
    var metadataEndpoint = "http://exhibitiontest.s3.amazonaws.com/";

    function processArticleListData(data) {
        var pathElements = $(data).find("Key");
        var responses = [];

        var paths = [];

        pathElements.each(function(i) {
            var pathElement = pathElements[i];
            var pathContent = pathElement.textContent;
            
            if (pathContent) {
                paths.push(pathContent);
            }
        });

        $(paths).each(function(j) {
            var path = paths[j];
            
            if (path.indexOf("/data.yaml") != -1) {
                var date = path.substring(0, that.DATELENGTH);
                var key = path.substring(that.DATELENGTH, path.indexOf("/data.yaml")); 
                var dataUrl = metadataEndpoint + path;
                var response = $.get(dataUrl, function(data) {
                    var articleData = processYamlData(data, date, key, paths);
                    var articleKey = {
                        date: date, 
                        key: key
                    };
                    
                    that.articlesByDate.push(articleKey);
                    that.articlesByKey.push(articleKey);
                    that.articles[key] = articleData;
                });

                responses.push(response);
            }
        });

        $.when.apply($, responses).done(function() {
            that.articlesByDate.sort(compareArticlesByDate);
            that.articlesByKey.sort(compareArticlesByKey);
            
            processArticles(that.articles, that.articlesByDate, that.articlesByKey);
        });
    }

    function processYamlData(yamlData, date, key, paths) {
        var result = jsyaml.load(yamlData);
        
        result.imageUrls = [];
        
        for (var i = 1; i <= 3; i++) {
            var image = "{0}{1}/image{2}.jpg".format(date, key, i);
            
            if (paths.indexOf(image) != -1) {
                var imageUrl = metadataEndpoint + image;
                
                result.imageUrls.push(imageUrl);
            }
        }
        
        result.descriptiveText = introduceParagraph(result.descriptiveText);
        result.urlTitle = getLastDir(key);
        result.trimmedName = getTrimmedName(result.urlTitle);

        return result;
    }

    function introduceParagraph(text) {
        var result = "<p>" + text + "</p>";

        result = result.replace(/\r\n\r\n/g, "</p><p>")
        result = result.replace(/\n\n/g, "</p><p>");

        return result;
    }

    function getLastDir(key) {
        var tokens = key.split("/");
        var lastDir = tokens[tokens.length - 1];

        return lastDir;
    }

    function getTrimmedName(name) {
        name = name.replace(/[^\w]/g, "");
        name = name.toLowerCase();

        return name;
    }
    
    function compareArticlesByDate(a, b) {
        var aDate = parseInt(a.date);
        var bDate = parseInt(b.date);
        return aDate - bDate;
    }
    
    function compareArticlesByKey(a, b) {
        if (a.key < b.key) {
            return -1;
        } else if (a.key > b.key) {
            return 1;
        }
        
        return 0;
    }
}
