var SAVE_INTERVAL = 1000;
var LOREM_IPSUM = [
  [
    { prompt: "What is your favorite pet?", html: "<h1>why mooses are the best (rough draft)</h1><p>I love mooses so much</p>" },
    { prompt: "What is your favorite flower?", html: "<h1>a rose by any other name</h1><p>would smell funky</p>" }
  ],
  [
    { prompt: "What is your favorite pet?", html: "<h1>why meese are the best (final draft)</h1><p>I love meese so much</p>" },
    { prompt: "What is your favorite flower?", html: "<h1>a rose by any other name</h1><p>would not smell the same</p>" }
  ]
];

ko.bindingHandlers.htmlValue = {
  init: function(element, valueAccessor, allBindingsAccessor) {
    ko.utils.registerEventHandler(element, 'blur keyup', function() {
      var modelValue = valueAccessor();
      modelValue(element.innerHTML);
    });
  },
  update: function(element, valueAccessor) {
    var value = ko.utils.unwrapObservable(valueAccessor()) || "";
    if (element.innerHTML !== value) element.innerHTML = value;
  }
};

function Content(d){
  var self = this;
  self.prompt = d.prompt;
  self.progressMetric = d.metric;
  self.requiredLength = d.requiredLength;
  self.html = ko.observable(d.html);
}
function Revision(name, index){
  var self = this;
  self.name = name;
  self.index = index;
  self.contents = ko.observableArray();
}
function DocumentViewModel(){
  var self = this;
  self.saveStatus = ko.observable("auto-saved.");
  self.revisions = ko.observableArray();
  self.shownRevision = ko.observable();
  self.cachedContentArray = ko.observableArray();
  self.contentArray = function(){
    return _.map(self.shownRevision().contents(), function (c) { return c.html(); });
  };
  self.needsSave = ko.computed(function() {
    if (self.cachedContentArray().length == 0) return false;
    if (_.isEqual(self.contentArray(), self.cachedContentArray())) return false;
    self.saveStatus("modified since last save.");
    return true;
  });
  self.throttledNeedsSave = ko.computed(self.needsSave).extend({ throttle: SAVE_INTERVAL });
  self.throttledNeedsSave.subscribe(function(ns){
    if (ns) {
      self.saveStatus("saving...");
      self.cachedContentArray(self.contentArray());
      // Pretend this sends cachedContentArray() to the server,
      // persists it to the database on the server, and gets back a status: 200.
      setTimeout(function(){
        self.cachedContentArray(self.contentArray());
        self.saveStatus("auto-saved.");
      }, 2000);
    }
  });
  self.loadRev = function(){
    self.shownRevision().contents([]);
    self.cachedContentArray([]);
    // Pretend this goes to the server to fetch the revision from the database.
    _.each(LOREM_IPSUM[self.shownRevision().index], function(d, i){
      var content = new Content({ prompt: d.prompt, html: d.html, index: i });
      self.shownRevision().contents.push(content);
    });
    self.cachedContentArray(self.contentArray());
  };
  self.shownRevision.subscribe(self.loadRev);
}

var doc = new DocumentViewModel();
doc.revisions([new Revision("Rough Draft", 0), new Revision("Final Draft", 1)]);
doc.shownRevision(doc.revisions()[0]);
ko.applyBindings(doc);
