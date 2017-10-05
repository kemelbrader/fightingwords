var articleTemplate;
var articleIndexItemTemplate;
var articleList;
var articleIndex;
var win;
var body;
var overlayMask;
var overlayImageContainer;
var prevNavControl;
var nextNavControl;
var dataManager;

$(function() {
    var articleTemplateSource = $("#article-template").html();
    var articleIndexItemTemplateSource = $("#article-index-item-template").html();

    articleTemplate = Handlebars.compile(articleTemplateSource);
    articleIndexItemTemplate = Handlebars.compile(articleIndexItemTemplateSource);
    articleList = $("#article-list");
    articleIndex = $("#article-index ul");
    overlayMask = $("#overlay-mask");
    overlayImageContainer = $("#overlay-image-container");
    prevNavControl = $(".nav-control.prev");
    nextNavControl = $(".nav-control.next");
    body = $("body");
    win = $(window);
    dataManager = new DataManager(processArticles);

    dataManager.initialize();
    
    win.on("hashchange", selectCurrentArticle);
    win.on("resize", processWindowResize);
    prevNavControl.on("click", selectPrevArticle);
    nextNavControl.on("click", selectNextArticle);
    overlayMask.on("click", handleImageGallaryClose);
    overlayImageContainer.on("click", handleImageGallaryClose);
    
    
    overlayMask[0].addEventListener("transitionend", addImageToOverlay, false );
    overlayMask[0].addEventListener("webkitTransitionEnd", addImageToOverlay, false );
});

function processArticles(articles, articlesByDate, articlesByKey) {
    for (i in articlesByDate) {
        var articleKey = articlesByDate[i];
        var articleData = articles[articleKey.key];
        var articleSource = articleTemplate(articleData)

        var article = $(articleSource);
        
        article.appendTo(articleList);
    }
    
    for (i in articlesByKey) {
        var articleKey = articlesByKey[i];
        var articleData = articles[articleKey.key];
        var trimmedName = articleData.trimmedName;
        var urlTitle = articleData.urlTitle;
        var articleIndexItemData = {
            href: trimmedName, 
            name: urlTitle
        }
        var articleIndexItemSource = articleIndexItemTemplate(articleIndexItemData);
        var indexListItem = $(articleIndexItemSource);
        
        indexListItem.appendTo(articleIndex);
    }
    
    $(".image-gallery img:not(.active)").on("click", handleImageGallerySelect);
    $(".image-gallery img.active").on("click", handleImageGalleryOpen);
    
    if (!location.hash) {
        var article = $("article:first-child");
        
        setHashToArticle(article);
    }
    
    selectCurrentArticle();
    resizeArticles();
    
    body.removeClass("disable-animation");
}

function processWindowResize() {
    selectCurrentArticle();
    resizeArticles();
}

function resizeArticles() {
    var windowWidth = $(window).width();
    var articleElements = articleList.find("article");
    
    executeWithoutTransitions(function() {
        articleElements.outerWidth(windowWidth);
    });
}

function getCurrentArticle() {
    var hash = location.hash;
    
    if (hash) {
        return getArticleByName(hash);
    }
    
    return null;
}

function getArticleByName(anchorName) {
    if (anchorName) {
        var article = $("article:has(a[name='{0}'])".format(anchorName));

        return article;
    }
    
    return null;
}

function selectCurrentArticle() {
    var article = getCurrentArticle();
    
    selectArticle(article)
}

function selectArticle(article) {
    var selectedArticleIndex = article.index();
    var windowWidth = $(window).width();
    var newArticleListLeft = -1 * selectedArticleIndex * windowWidth;

    resetNavControl(article);
    articleList.css("left", newArticleListLeft);
    
    lazyLoadElements(article, ".video iframe");
    lazyLoadElements(article, ".image-gallery img");
    
    
}

function getArticleName(article) {
    var articleAnchor = article.find("a[name]");
    var name = articleAnchor.attr("name");

    return name;
}

function lazyLoadElements(article, selector) {
    var elements = article.find(selector);
    
    elements.each(function(i) {
        var element = $(elements[i]);
        
        if (element.attr("src") === "") {
            var url = element.data("url");
            
            element.attr("src", url)
        }
    })
}

function selectPrevArticle() {
    var currentArticle = getCurrentArticle();
    var articleToSelect = currentArticle.prev();
    
    setHashToArticle(articleToSelect);
}

function selectNextArticle() {
    var currentArticle = getCurrentArticle();
    var articleToSelect = currentArticle.next();
    
    setHashToArticle(articleToSelect);
}

function setHashToArticle(article) {
    if (article.length !== 0) {
        var articleName = getArticleName(article)
    
        location.hash = articleName;
    }
}

function resetNavControl(article) {
    var next = article.next();
    var prev = article.prev();
    
    $(".nav-control").removeClass("disabled");
        
    if (next.length === 0) {
        $(".nav-control.next").addClass("disabled");
    }
    
    if (prev.length === 0) {
        $(".nav-control.prev").addClass("disabled");
    } 
}

function handleImageGallaryClose() {
    overlayImageContainer.css("opacity", 0);
    overlayImageContainer.css("display", "none"); // FIXME causes animation to not finish
    overlayImageContainer.empty();
    body.removeClass("overlay");
}

function handleImageGallerySelect() {
    var selectedImage = $(this);
    var imageGallery = selectedImage.parent();
    var activeImage = imageGallery.find("img.active");
    
    activeImage.attr("src", selectedImage.attr("src"));
}

function handleImageGalleryOpen() {
    var image = $(this);
    
    overlayImage(image);
}

function overlayImage(image) {
    var clone = image.clone();
    
    overlayImageContainer.append(clone);
    body.addClass("overlay");
}

function addImageToOverlay() {
    // TODO only execute if at the endpoint of the animation
    overlayImageContainer.css("display", "block");
    
    window.setTimeout(function() { // FIXME HACK!!! Why doesn't it work without the timeout?
        overlayImageContainer.css("opacity", 1);
    }, 500);
}


function executeWithoutTransitions(func) {
    if (body.hasClass("disable-animation")) {
        func();
    } else {
        body.addClass("disable-animation");
        func();
        body.removeClass("disable-animation");
    }
}