'use strict';
angular.module('lm.surveys').controller('metricGroupRepeaterController', ['$scope', function ($scope) {
    var allText = "- all -";

    $scope.search = {};
    $scope.relationships = {};
    $scope.relationshipTitles = [];
    $scope.isDataList = false;
    $scope.rows = [];
    $scope.maxRow = 15;

    if ($scope.metricGroup.type === "IterativeRepeater") {
        $scope.isDataList = false;
        for (var i = 0; i < $scope.metricGroup.numberOfRows; i++) {
            $scope.rows.push({ rowNumber: i + 1, dataListItem: undefined });
        }
    }
    else {
        $scope.isDataList = true;
        $scope.relationshipTitles = _.map($scope.metricGroup.dataList.items[0].attributes, 'title');
        angular.forEach($scope.metricGroup.dataList.items, function (item, index) {
            $scope.rows.push({ rowNumber: index + 1, dataListItem: item });

            angular.forEach(item.attributes, function (attr) {
                if ($scope.relationships[attr.title] === undefined)
                    $scope.relationships[attr.title] = [allText];
                $scope.relationships[attr.title].push(attr.value);
            });
        });

        angular.forEach($scope.relationshipTitles, function (title) {
            $scope.search[title] = allText;
            $scope.relationships[title] = _.uniq($scope.relationships[title]);
            $scope.relationships[title] = _.sortBy($scope.relationships[title], function (s) { return s; });
        });

        $scope.attrFilter = function (search) {
            var keys = Object.keys(search);
            return function (item, index) {
                var matched = true;
                angular.forEach(keys, function (prop) {
                    if (search[prop] === allText) return;
                    if (_.find(item.attributes, 'title', prop).value != search[prop])
                        matched = false;
                });
                return matched;
            }
        }
    }

    $scope.addRow = function () {
        $scope.rows.push({ rowNumber: $scope.rows.length + 1, dataListItem: undefined });
    }

    $scope.showAll = function () {
        $scope.maxRow += $scope.maxRow;
    }

    $scope.deleteRow = function (rowNumber) {
        
        $scope.rows.splice(rowNumber - 1, 1);

        var groupMetricIds = _.map($scope.metricGroup.metrics, "id");

        _.remove($scope.allFormValues, function (formValue) {
            return formValue.rowNumber === rowNumber && _.includes(groupMetricIds, formValue.metricId);
        });

        angular.forEach($scope.allFormValues, function (formValue) {
            if (_.includes(groupMetricIds, formValue.metricId)) {
                if (formValue.rowNumber >= rowNumber) {
                    formValue.rowNumber = formValue.rowNumber - 1;
                }
            }
        });
    }
}]);