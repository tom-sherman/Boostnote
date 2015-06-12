/* global angular */

var remote = require('remote')
var ipc = require('ipc')

angular.module('codexen.popup', [
  'ui.ace',
  'satellizer',
  'cfp.hotkeys'
])
.controller('PopUpController', function ($scope, Snippet, $auth, $window, hotkeys, $document, $filter) {

  // For Dev
  $scope.toggleDev = function () {
    remote.getCurrentWindow().toggleDevTools()
  }

  // Setup Events
  remote.getCurrentWindow().on('focus', function () {
    $scope.$apply(focusSearchInput)
    loadSnippets()
  })

  hotkeys.bindTo($scope)
    .add('down', function (e) {
      nextSnippet()
      e.preventDefault()
    })
    .add('up', function (e) {
      priorSnippet()
      e.preventDefault()
    })
    .add('right', function (e) {
    })
    .add('left', function (e) {
    })
    .add('esc', function (e) {
      hidePopUp()
    })
    .add('shift+tab', function (e) {
      e.preventDefault()
    })
    .add('tab', function (e) {
    })
    .add('enter', function (e) {
      console.log($scope.selectedItem.content)
      ipc.send('writeCode', $scope.selectedItem.content)
      e.preventDefault()
    })

  $scope.aceLoaded = function (editor) {
    editor.commands.addCommand({
      name: 'escape',
      bindKey: {win: 'esc', mac: 'esc'},
      exec: function (editor) {
        editor.blur()
        $scope.$apply()
      },
      readOnly: true
    })
  }

  $scope.$on('nextSnippetRequested', function (e) {
    e.stopPropagation()
    nextSnippet()
  })

  $scope.$on('priorSnippetRequested', function (e) {
    e.stopPropagation()
    priorSnippet()
  })

  $scope.$on('snippetSubmitted', function (e) {
    if ($scope.filteredSnippets.length > 0) ipc.send('writeCode', $scope.selectedItem.content)
    else console.log('\x07')
    e.stopPropagation()
  })

  // Init Data
  $scope.snippets = []

  Snippet.findMine()
    .success(function (data) {
      $scope.snippets = data
      filterList()
    })

  // Result Item control
  $scope.selectIndex = 0

  $scope.selectSnippet = selectSnippet
  $scope.filterList = filterList
  $scope.focusSearchInput = focusSearchInput

  // Search Filter
  function loadSnippets () {
    Snippet.findMine()
      .success(function (data) {
        $scope.snippets = data
        filterList()
      })
  }

  function filterList (needle) {
    $scope.filteredSnippets = $filter('filter')($scope.snippets, needle)
    firstSnippet()
  }

  function selectSnippet (index) {
    if (index !== undefined) $scope.selectIndex = index
    $scope.selectedItem = $scope.filteredSnippets[$scope.selectIndex]
  }

  function firstSnippet () {
    $scope.selectIndex = 0
    selectSnippet($scope.selectIndex)
  }

  function priorSnippet () {
    if ($scope.selectIndex > 0) $scope.selectIndex -= 1
    selectSnippet()
  }

  function nextSnippet () {
    if ($scope.selectIndex < $scope.filteredSnippets.length - 1) {
      $scope.selectIndex += 1
    }
    selectSnippet()
  }

  // Focusing Search Input
  function focusSearchInput () {
    document.getElementById('search-input').focus()
  }

  function hidePopUp () {
    ipc.send('hidePopUp')
  }

})
.directive('searchInput', function () {
  return {
    restrict: 'A',
    link: function (scope, el, attr) {
      el.on('keydown', function (e) {
        // Down key => Focus on Result list
        if (e.keyCode === 40) {
          scope.$emit('nextSnippetRequested')
          // e.preventDefault()
        }

        // Up key => Focus on Result list
        if (e.keyCode === 38) {
          scope.$emit('priorSnippetRequested')
          // e.preventDefault()
        }

        // Up key => Focus on Result list
        if (e.keyCode === 13) {
          scope.$emit('snippetSubmitted')
        }

        // Esc key => Dismiss popup
        if (e.keyCode === 27) {
          ipc.send('hidePopUp')
          e.preventDefault()
        }

        // TODO: Tab key => Auto complete
        if (e.keyCode === 9) {
          e.preventDefault()
        }
      })
    }
  }
})