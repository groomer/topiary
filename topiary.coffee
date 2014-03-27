SAVE_INTERVAL = 1000

LOREM_IPSUM = [
  [
    { prompt: "What is your favorite pet?", html: "<h1>why mooses are the best (rough draft)</h1><p>I love mooses so much</p>" },
    { prompt: "What is your favorite flower?", html: "<h1>a rose by any other name</h1><p>would smell funky</p>" }
  ],
  [
    { prompt: "What is your favorite pet?", html: "<h1>why meese are the best (final draft)</h1><p>I love meese so much</p>" },
    { prompt: "What is your favorite flower?", html: "<h1>a rose by any other name</h1><p>would not smell the same</p>" }
  ]
]

ko.bindingHandlers.htmlValue = do ->

  assimilator = (element, valueAccessor) -> ->
      modelValue = valueAccessor()
      modelValue element.innerHTML

  init: (element, valueAccessor, allBindingsAccessor) ->
    assimilate = assimilator element, valueAccessor
    ko.utils.registerEventHandler element, 'blur', assimilate
    ko.utils.registerEventHandler element, 'keyup', assimilate

  update: (element, valueAccessor) ->
    value = ko.utils.unwrapObservable(valueAccessor()) or ''
    element.innerHTML = value unless element.innerHTML is value

createContent = ( { prompt, requiredLength, metric: progressMetric, html } ) ->
  { prompt, requiredLength, progressMetric, html: ko.observable html }

createRevision = (name, index) -> { name, index, contents: ko.observableArray() }

createDocumentViewModel = ->
  saveStatus = ko.observable("auto-saved.")
  revisions = ko.observableArray()
  shownRevision = ko.observable()
  cachedContentArray = ko.observableArray()
  contentArray = -> _.map shownRevision().contents(), (c) -> c.html()

  needsSave = ko.computed ->
    return false unless cachedContentArray().length
    return false if _.isEqual contentArray(), cachedContentArray()
    saveStatus "modified since last save."
    true

  throttledNeedsSave = ko.computed(needsSave).extend throttle: SAVE_INTERVAL

  throttledNeedsSave.subscribe (ns) ->
    return unless ns
    saveStatus "saving..."
    cachedContentArray contentArray()
    # Pretend this sends cachedContentArray() to the server,
    # persists it to the database on the server, and gets back a status: 200.
    setTimeout ->
      cachedContentArray contentArray()
      saveStatus("auto-saved.");
    , 2000

  loadRev = =>
    shownRevision().contents []
    cachedContentArray []
    # Pretend this goes to the server to fetch the revision from the database.
    _.each LOREM_IPSUM[shownRevision().index], (d, i) =>
      content = createContent prompt: d.prompt, html: d.html, index: i
      shownRevision().contents.push content
    cachedContentArray contentArray()

  shownRevision.subscribe loadRev
  { saveStatus, revisions, shownRevision, cachedContentArray, contentArray, loadRev }


doc = createDocumentViewModel()
doc.revisions [createRevision("Rough Draft", 0), createRevision("Final Draft", 1)]
doc.shownRevision doc.revisions()[0]
ko.applyBindings doc
