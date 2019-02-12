(function () {
    'use strict';
    angular.module('lm.surveys').controller('surveyController', ['$rootScope', '$scope', '$ionicHistory', '$stateParams', '$state', 'userService',
        'surveyService', 'gettext', '$timeout', 'httpService', '$ionicPopup', 'toastr', '$ionicLoading', 'locationService', 
        function ($rootScope, $scope, $ionicHistory, $stateParams, $state, userService, surveyService,
            gettext, $timeout, httpService, $ionicPopup, toastr, $ionicLoading, locationService) {

            $scope.surveyId = $stateParams.id;
            $scope.surveyIndex = $stateParams.index;
            $scope.totalRecords = $stateParams.total;
            $scope.formTemplate = null;
            $scope.currentPageIndex = -1;
            $scope.numberOfPages = 0;
            $scope.activeGroups = [];
            $scope.allFormValues = [];
            $scope.uploadWorking = false;

            $scope.geocoding = {
                latitude: undefined,
                longitude: undefined,
                accuracy: 0,
                address: '',
                formattedAddress: '',
                hasLocation: false
            };

            var populateFormValues = function () {
                $scope.survey.formValues = [];
                for (var i = 0; i < $scope.formTemplate.metricGroups.length; i++) {
                    for (var j = 0; j < $scope.formTemplate.metricGroups[i].metrics.length; j++) {
                        var metric = $scope.formTemplate.metricGroups[i].metrics[j];

                        if (!_.isUndefined(metric.formValue)) {
                            if (metric.isComplex) {
                                for (var key in metric.formValue) {
                                    $scope.survey.formValues.push(metric.formValue[key]);
                                }
                            } else {
                                metric.formValue.metricId = metric.id;
                                $scope.survey.formValues.push(metric.formValue);
                            }
                        }
                    }
                }
            };

            $scope.isCurrentPage = function (metricGroup) {
                if ($scope.currentPageIndex === -1) return false;
                return metricGroup.page === $scope.currentPageIndex + 1;
            };

            $scope.isFirstPage = function () {
                if ($scope.currentPageIndex === -1) return false;
                return $scope.currentPageIndex === 0;
            };

            $scope.isLastPage = function () {
                if ($scope.currentPageIndex === -1) return false;
                return $scope.currentPageIndex + 1 === $scope.numberOfPages;
            };

            $scope.goToNextPage = function () {
                if (!$scope.isLastPage()) {
                    $scope.goToPageIndex($scope.currentPageIndex + 1);
                }
            };

            $scope.goToPreviousPage = function () {
                if (!$scope.isFirstPage()) {
                    _.remove($scope.activeGroups, function (group) {
                        var index = $scope.currentPageIndex + 1;
                        return group.page == index;
                    });
                    $scope.goToPageIndex($scope.currentPageIndex - 1);
                }
            };

            $scope.goToPageIndex = function (index) {
                if (index >= 0 && index < $scope.numberOfPages) {
                    if (index > $scope.currentPageIndex) {
                        _.forEach(_.filter($scope.formTemplate.metricGroups, function (group) {
                            return group.page <= index + 1;
                        }), function (group) {
                            if (_.find($scope.activeGroups, {
                                    'id': group.id
                                }))
                                return;
                            $scope.activeGroups.push(group);
                        });

                        // reorder and sort metrics for Survey templates.
                        if ($scope.formTemplate.discriminator === 0) {
                            // sort metrics by type. we want the attachment metric 
                            // to be the first displayed on the survey form.
                            // since we use a single template for all forms,
                            // it's safe to assume we'll have the same structure.
                            var metrics = $scope.activeGroups[0].metrics;

                            var _attachmentMetric = _.filter(metrics, function (m) {
                                return m.type === 'attachmentMetric';
                            });

                            var _dateMetric = _.filter(metrics, function (m) {
                                return m.type === 'dateMetric';
                            });

                            var _textMetric = _.filter(metrics, function (m) {
                                return m.type === 'freeTextMetric';
                            });

                            var _rateMetric = _.filter(metrics, function (m) {
                                return m.type === 'rateMetric';
                            });

                            var sortedMetrics = [];
                            sortedMetrics.push(_attachmentMetric[0]);
                            sortedMetrics.push(_dateMetric[0]);
                            sortedMetrics.push(_textMetric[0]);
                            sortedMetrics.push(_rateMetric[0]);

                            $scope.activeGroups[0].metrics = sortedMetrics;
                        } else if ($scope.formTemplate.discriminator === 1) {
                            var adviceMetrics = $scope.activeGroups[0].metrics;

                            var adviceAttachmentMetric = _.filter(adviceMetrics, function (m) {
                                return m.type === 'attachmentMetric';
                            });

                            var adviceTextMetric = _.filter(adviceMetrics, function (m) {
                                return m.type === 'freeTextMetric';
                            });

                            var sortedAdviceMetrics = [];
                            sortedAdviceMetrics.push(adviceAttachmentMetric[0]);
                            sortedAdviceMetrics.push(adviceTextMetric[0]);

                            $scope.activeGroups[0].metrics = sortedAdviceMetrics;
                        }
                    }

                    $scope.currentPageIndex = index;
                }
            };

            $scope.saveDraft = function () {
                if ($scope.formTemplate === null)
                    return;

                //populateFormValues();
                $scope.survey.formValues = $scope.allFormValues;

                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Saving draft...'
                });

                surveyService.saveDraft($scope.survey)
                    .then(function () {
                        toastr.success('Draft saved successfully');
                    }, function (err) {
                        console.error('could not save draft', err);
                        toastr.error('Could not save your draft, sorry');
                    }).finally(function () {
                        $ionicLoading.hide();
                    });
            };

            $scope.back = function () {
                $ionicHistory.goBack();
            };

            $scope.delete = function () {
                if (confirm(gettext("Are you sure you want to delete this record?"))) {
                    $ionicLoading.show({
                        template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Deleting record...'
                    });

                    surveyService.delete($scope.surveyId)
                        .then(function () {
                            $ionicHistory.goBack();
                        }, function (err) {
                            console.error('could not delete record', err);
                            toastr.error('Could not delete record, sorry');
                        }).finally(function () {
                            $ionicLoading.hide();
                        });
                }
            };

            $scope.dateToString = function (isoString) {
                var utcDate = moment(isoString);
                var localDate = utcDate.local();

                if (userService.current.calendar === "Gregorian") {
                    return localDate.format('L LT');
                } else {
                    var dateValue = persianDate(localDate.toDate());
                    return dateValue.format("dddd, DD MMMM YYYY");
                }
            };

            $scope.submitSurvey = function () {
                if ($scope.formTemplate === null) {
                    toastr.error('form-template is null');
                    return;
                }

                $scope.survey.formValues = $scope.allFormValues;

                var validationErrors = [];

                _.forEach($scope.survey.formValues, function (fv) {
                    _.forEach($scope.formTemplate.metricGroups, function (mg) {
                        var metric = _.filter(mg.metrics, function (m) {
                            return m.id === fv.metricId;
                        });

                        if (metric && metric.length) {
                            switch (metric[0].type) {
                                case 'attachmentMetric':
                                    {
                                        if (!fv.attachments || fv.attachments.length < 1) {
                                            validationErrors.push('- No attachments made');
                                        }
                                        break;
                                    }
                                case 'rateMetric':
                                    {
                                        if (!fv.numericValue || fv.numericValue === 0) {
                                            validationErrors.push('- Impact rate is zero');
                                        }
                                        break;
                                    }
                            }
                        }
                    });
                });

                if (!$scope.geocoding.hasLocation) {
                    validationErrors.push('- record location has not been set');
                }

                if (validationErrors.length) {
                    var popupTemplate = "<ul class='lead validation_error_list'>";
                    _.forEach(validationErrors, function (ve) {
                        popupTemplate += '<li>' + ve + '</li>';
                    });
                    popupTemplate += "</ul>";

                    var validationPopup = $ionicPopup.confirm({
                        title: 'Record validation',
                        subTitle: 'Are you sure you want to submit this?',
                        template: popupTemplate,
                        scope: $scope,
                        buttons: [{
                                text: 'Yes, proceed',
                                type: 'button-royal button-block',
                                onTap: function () {
                                    return true;
                                }
                            },
                            {
                                text: 'Cancel',
                                type: 'button-stable button-block'
                            }
                        ]
                    });

                    validationPopup.then(function (res) {
                        if (res) {
                            $scope.doSubmit();
                        } else {
                            validationPopup.close();
                        }
                    });
                } else {
                    $scope.doSubmit();
                }
            };

            $scope.doSubmit = function () {
                $scope.uploadWorking = true;

                // set location values.
                if ($scope.geocoding.hasLocation) {
                    $scope.survey.locations = [];
                    $scope.survey.locations.push({
                        latitude: $scope.geocoding.latitude,
                        longitude: $scope.geocoding.longitude,
                        accuracy: $scope.geocoding.accuracy,
                        address: $scope.geocoding.formattedAddress,
                        error: '',
                        event: 'Submission'
                    });
                }

                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Submitting record...'
                });

                surveyService.submitSurvey($scope.survey)
                    .then(function () {
                            $timeout(function () {
                                $ionicLoading.hide();
                                $state.go('home');
                            }, 1000);
                        },
                        function (err) {
                            $ionicLoading.hide();
                            console.error('could not submit survey', err);
                            toastr.error('Could not submit your record, sorry');
                        })
                    .finally(function () {
                        $scope.uploadWorking = false;
                    });
            };

            $scope.getMetricShortTitle = function (inputName) {
                for (var i = 0; i < $scope.formTemplate.metricGroups.length; i++) {
                    for (var j = 0; j < $scope.formTemplate.metricGroups[i].metrics.length; j++) {
                        if ($scope.formTemplate.metricGroups[i].metrics[j].inputName === inputName)
                            return $scope.formTemplate.metricGroups[i].metrics[j].shortTitle;
                    }
                }
            };

            $scope.addFormValue = function (metric, rowDataListItem, rowNumber) {
                var formValue = {};
                formValue.metricId = metric.id;
                formValue.rowNumber = rowNumber;
                if (rowDataListItem)
                    formValue.rowDataListItemId = rowDataListItem.id;
                $scope.allFormValues.push(formValue);
                return formValue;
            };

            $scope.doRefresh = function () {
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Loading...'
                });

                httpService.getSurvey($scope.surveyId)
                    .then(function (data) {
                        surveyService.getTemplateWithValues($scope.surveyId).then(
                            function (template) {
                                _.forEach(template.metricGroups, function (group) {
                                    _.forEach(group.metrics, function (metric) {
                                        metric.type = _.camelCase(metric.type);
                                    });
                                });

                                $scope.formTemplate = template;
                                $scope.survey = data;
                                $scope.allFormValues = data.formValues;
                                $scope.numberOfPages = _.max(template.metricGroups, 'page').page;

                                $rootScope.$broadcast('refresh-survey-attachments', data);
                                $scope.goToPageIndex(0);
                            },
                            function (err) {
                                console.error('could not load template with values', err);
                            });
                    }, function (err) {
                        console.error('could not reload survey', err);
                    }).finally(function () {
                        $scope.$broadcast('scroll.refreshComplete');
                        $ionicLoading.hide();
                    });
            };

            $scope.getAddress = function () {
                var geocoder = new google.maps.Geocoder();
                var address = $scope.geocoding.address;

                if (address.length < 1) {
                    toastr.error('Please enter an address first');
                    return;
                }

                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Geocoding address...'
                });

                geocoder.geocode({ 'address': address }, function (result, status) {
                    $ionicLoading.hide();

                    if (status == google.maps.GeocoderStatus.OK) {
                        var formattedAddress = result[0].formatted_address;
                        var lat = result[0].geometry.location.lat();
                        var lng = result[0].geometry.location.lng();

                        $scope.$apply(function () {
                            $scope.geocoding.latitude = lat;
                            $scope.geocoding.longitude = lng;
                            $scope.geocoding.address = formattedAddress;
                            $scope.geocoding.formattedAddress = formattedAddress;
                            $scope.geocoding.hasLocation = true;
                        });

                        $scope.getMap(lat, lng, formattedAddress);
                    } else {
                        toastr.error('Something went wrong, could not fetch location');
                    }
                });
            }

            $scope.getMyLocation = function () {
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Getting your location...'
                });

                locationService.getCurrentPosition()
                    .then(function (result) {
                        var latitude = result.latitude;
                        var longitude = result.longitude;
                        var accuracy = result.accuracy;

                        var geocoder = new google.maps.Geocoder();
                        var latLng = new google.maps.LatLng(latitude, longitude);

                        geocoder.geocode({ 'latLng': latLng }, function (res, status) {
                            $ionicLoading.hide();
                            
                            if (status == google.maps.GeocoderStatus.OK) {
                                if (res[0]) {
                                    var formattedAddress = res[0].formatted_address;

                                    $scope.$apply(function () {
                                        $scope.geocoding.latitude = latitude;
                                        $scope.geocoding.longitude = longitude;
                                        $scope.geocoding.accuracy = accuracy;
                                        $scope.geocoding.address = formattedAddress;
                                        $scope.geocoding.formattedAddress = formattedAddress;
                                        $scope.geocoding.hasLocation = true;
                                    });

                                    $scope.getMap(latitude, longitude, formattedAddress);
                                } else {
                                    console.warn('address not found!');
                                    toastr.error('Address not found!');
                                }
                            } else {
                                toastr.error('Something went wrong, address not found');
                            }
                        });
                    }, function (err) {
                        $ionicLoading.hide();
                        console.error(err);
                        toastr.error('Something went wrong, could not fetch location');
                    });
            }

            $scope.clearLocation = function () {
                $scope.geocoding = {
                    latitude: undefined,
                    longitude: undefined,
                    accuracy: 0,
                    address: '',
                    formattedAddress: '',
                    hasLocation: false
                };
            }

            $scope.getMap = function (latitude, longitude, address) {
                var latlng = new google.maps.LatLng(latitude,longitude);

                var mapOptions = {
                    zoom: 14,
                    center: latlng,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    mapTypeControl: true,
                    streetViewControl: false
                };

                var map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

                var marker = new google.maps.Marker({
                    position: latlng, 
                    map: map, 
                    draggable: true,
                    title: address
                });

                google.maps.event.addListener(marker, 'dragend', function (e) {
                    var lat = e.latLng.lat();
                    var lng = e.latLng.lng();

                    var geocoder = new google.maps.Geocoder();
                    var latLng = new google.maps.LatLng(lat, lng);

                    $ionicLoading.show({
                        template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Geocoding location...'
                    });

                    geocoder.geocode({ 'latLng': latLng }, function (res, status) {
                        $ionicLoading.hide();
                        
                        if (status == google.maps.GeocoderStatus.OK) {
                            if (res[0]) {
                                var formattedAddress = res[0].formatted_address;

                                $scope.$apply(function () {
                                    $scope.geocoding.latitude = lat;
                                    $scope.geocoding.longitude = lng;
                                    $scope.geocoding.address = formattedAddress;
                                    $scope.geocoding.formattedAddress = formattedAddress;
                                });
                            } else {
                                console.warn('address not found!');
                                toastr.error('Address not found!');
                            }
                        } else {
                            toastr.error('Something went wrong, address not found');
                        }
                    });
                });

                google.maps.event.addListener(marker, 'click', function (e) {
                    var infoWindow = new google.maps.InfoWindow();
                    infoWindow.setContent(address);
                    infoWindow.open(map, marker);
                });
            }

            $scope.activate = function () {
                $ionicLoading.show({
                    template: '<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Loading...'
                });

                surveyService.getTemplateWithValues($scope.surveyId)
                    .then(function (template) {
                        _.forEach(template.metricGroups, function (group) {
                            _.forEach(group.metrics, function (metric) {
                                metric.type = _.camelCase(metric.type);
                            });
                        });

                        $scope.formTemplate = template;
                        $scope.survey = template.survey;
                        $scope.allFormValues = template.survey.formValues;
                        $scope.numberOfPages = _.max(template.metricGroups, 'page').page;

                        var locations = $scope.survey.locations;
                        var positions = [];

                        _.forEach(locations, (function (pos, index) {
                            positions.push({
                                center: {
                                    latitude: pos.latitude,
                                    longitude: pos.longitude
                                },
                                zoom: 10,
                                options: {
                                    scrollwheel: false,
                                    streetViewControl: false,
                                    mapTypeControl: true
                                },
                                marker: {
                                    id: index + 1,
                                    coords: {
                                        latitude: pos.latitude,
                                        longitude: pos.longitude
                                    },
                                    options: {
                                        draggable: false,
                                        title: pos.address
                                    },
                                    events: {
                                        click: function(marker, eventName, args) {
                                            var infoWindow = new google.maps.InfoWindow;
                                            var popupContent;
                                            if (pos.address && pos.address.length) {
                                                popupContent = "<p style='margin: 0'><span><b>Serial:</b> #" + $scope.survey.serial + "</span><br><span style='display: block; padding-top: 5px'>" + pos.address + "</span></p>";
                                            } else {
                                                popupContent = "<p style='margin: 0'><span><b>Serial:</b> #" + $scope.survey.serial + "</span></p>";
                                            }

                                            infoWindow.setContent(popupContent);
                                            infoWindow.open($scope.map, marker);
                                        }
                                    }
                                }
                            });
                        }));

                        $scope.locations = positions;
                        $scope.goToPageIndex(0);
                    }, function (err) {
                        toastr.error('Error in loading data, sorry');
                    }).finally(function () {
                        $ionicLoading.hide();
                    });
            };

            $scope.activate();
        }
    ]);
}());