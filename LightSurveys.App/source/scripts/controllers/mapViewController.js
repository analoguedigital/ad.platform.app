(function () {
    'use strict';
    angular.module('lm.surveys').controller('mapViewController', ['$scope', '$q', 'surveyService', 'localStorageService',
        '$ionicModal', '$timeout', '$ionicLoading', '$compile', '$window', 'uiGmapGoogleMapApi',
        function ($scope, $q, surveyService, localStorageService, $ionicModal, $timeout, $ionicLoading, $compile, $window, uiGmapGoogleMapApi) {
            $scope.threads = [];
            $scope.surveys = [];
            $scope.locations = [];
            $scope.markers = [];

            $scope.$on('$ionicView.loaded', function () {
                $timeout(function () {
                    var mapHeight = $window.innerHeight - 60;
                    var mapEl = document.getElementsByClassName('angular-google-map-container')[0];
                    if (mapEl) {
                        mapEl.setAttribute('style', 'height: ' + mapHeight + 'px');
                    }
                }, 750);
            });

            $scope.pinSymbol = function (color) {
                return {
                    path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0',
                    fillColor: color,
                    fillOpacity: 1,
                    strokeColor: '#333',
                    strokeWeight: 2,
                    scale: 1,
                };
            }

            $scope.loadData = function () {
                var deferred = $q.defer();

                var promises = [];
                promises.push(surveyService.getFormTemplates());
                promises.push(surveyService.getAllSubmittedSurveys());

                $q.all(promises).then(function (data) {
                    deferred.resolve(data);
                }, function (err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            }

            $scope.reloadMap = function (setMapBounds = false) {
                $scope.extractLocations();
                $scope.generateMarkers();
                $scope.generateMap(setMapBounds);
            }

            $scope.extractLocations = function () {
                var locations = [];

                _.forEach($scope.surveys, function (survey) {
                    _.forEach(survey.locations, function (loc) {
                        var thread = _.find($scope.threads, function (t) {
                            return t.id == survey.formTemplateId;
                        });

                        if (thread && thread.isSelected) {
                            var entry = {
                                // position data
                                accuracy: loc.accuracy,
                                error: loc.error,
                                event: loc.event,
                                latitude: loc.latitude,
                                longitude: loc.longitude,
                                address: loc.address,
                                // survey data
                                id: survey.id,
                                color: thread.colour,
                                description: survey.description,
                                serial: survey.serial,
                                date: moment(survey.surveyDate).format('ddd, MMM Do YYYY')
                            };

                            locations.push(entry);
                        }
                    });
                });

                $scope.locations = locations;
            }

            $scope.generateMarkers = function () {
                // gmaps v3 custom icons:
                // https://stackoverflow.com/questions/7095574/google-maps-api-3-custom-marker-color-for-default-dot-marker/7686977

                $scope.markers = [];

                _.forEach($scope.locations, function (loc, index) {
                    var pinColor = "ffffff";
                    if (loc.color && loc.color.length)
                        pinColor = loc.color.substr(1, loc.color.length - 1);

                    try {
                        var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
                            new google.maps.Size(21, 34),
                            new google.maps.Point(0, 0),
                            new google.maps.Point(10, 34));
                        var pinShadow = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_shadow",
                            new google.maps.Size(40, 37),
                            new google.maps.Point(0, 0),
                            new google.maps.Point(12, 35));

                        // one option is to show serials and descriptions:
                        // #1234 - survey description
                        var markerTitle = '#' + loc.serial;
                        if (loc.description && loc.description.length)
                            markerTitle += ' - ' + loc.description;

                        var marker = {
                            id: index,
                            coords: {
                                latitude: loc.latitude,
                                longitude: loc.longitude
                            },
                            options: {
                                draggable: false,
                                //icon: pinImage,
                                icon: $scope.pinSymbol(loc.color),
                                shadow: pinShadow,
                                title: markerTitle,
                                event: loc.event
                            },
                            events: {
                                click: function (marker, eventName, args) {
                                    var lat = marker.getPosition().lat();
                                    var lon = marker.getPosition().lng();

                                    var infoWindow = new google.maps.InfoWindow;

                                    var surveyLink = `<p><a ui-sref='surveyView({id: "${loc.id}"})'><i class='fa fa-arrow-right'> go to record</a></p>`;
                                    var compiledLink = $compile(surveyLink)($scope);

                                    var popupContent;
                                    if (loc.address && loc.address.length) {
                                        popupContent = '<p style="margin-bottom: 0"><b>Serial:</b> #' + + loc.serial + '<br>' +
                                            '<b>Date:</b> ' + loc.date + '<br><br>' + loc.address + '</p>' +
                                            '<p style="margin-top: 5px; padding-top: 5px; margin-bottom: 0; border-top: 1px solid #ddd">' + compiledLink[0].innerHTML + '</p>';
                                    } else {
                                        popupContent = '<p style="margin-bottom: 0"><b>Serial:</b> #' + + loc.serial + '<br>' +
                                            '<b>Date:</b> ' + loc.date + '</p>' +
                                            '<p style="margin-top: 5px; padding-top: 5px; margin-bottom: 0; border-top: 1px solid #ddd">' + compiledLink[0].innerHTML + '</p>';
                                    }

                                    infoWindow.setContent(popupContent);
                                    infoWindow.open($scope.map, marker);
                                }
                            }
                        };

                        $scope.markers.push(marker);
                    } catch (e) {
                        console.error(e);
                    }
                });
            }

            $scope.generateMap = function (setMapBounds = false) {
                var lsCenter = localStorageService.get('map_center');
                var lsZoom = localStorageService.get('map_zoom_level');
                var lsMapType = localStorageService.get('map_type_id');

                var _mapCenter = {};
                if (lsCenter !== null) {
                    _mapCenter = lsCenter;
                } else {
                    var loc = $scope.locations[0];
                    _mapCenter = { latitude: loc.latitude, longitude: loc.longitude };
                }

                var _mapZoom = 14;
                if (lsZoom !== null) {
                    _mapZoom = lsZoom;
                }

                var _mapType = google.maps.MapTypeId.ROADMAP;
                if (lsMapType !== null) {
                    if (lsMapType === 'roadmap')
                        _mapType = google.maps.MapTypeId.ROADMAP;
                    else if (lsMapType === 'hybrid')
                        _mapType = google.maps.MapTypeId.HYBRID;
                }

                $scope.map = {
                    center: _mapCenter,
                    zoom: _mapZoom,
                    options: {
                        scrollwheel: false,
                        mapTypeId: _mapType,
                        mapTypeControl: true,
                        streetViewControl: false
                    },
                    events: {
                        'zoom_changed': function (map, eventName, args) {
                            var zoomLevel = map.getZoom();
                            localStorageService.set('map_zoom_level', zoomLevel);
                        },
                        'maptypeid_changed': function (map, eventName, args) {
                            var mapTypeId = map.getMapTypeId();
                            localStorageService.set('map_type_id', mapTypeId);
                        },
                        'center_changed': function (map, eventName, args) {
                            var mapCenter = map.getCenter();
                            var lat = mapCenter.lat();
                            var lng = mapCenter.lng();

                            localStorageService.set('map_center', { latitude: lat, longitude: lng });
                        }
                    }
                };

                $timeout(function () {
                    var mapHeight = $window.innerHeight - 60;
                    var mapEl = document.getElementsByClassName('angular-google-map-container')[0];
                    if (mapEl) {
                        mapEl.setAttribute('style', 'height: ' + mapHeight + 'px');
                    }
                }, 250);

                if (lsCenter == null && lsZoom == null && lsMapType == null) {
                    $scope.setBounds();
                } else {
                    if (setMapBounds !== undefined && setMapBounds === true) {
                        $scope.setBounds();
                    }
                }
            }

            $scope.setBounds = function () {
                $timeout(function () {
                    $scope.$apply(function () {
                        if ($scope.markers.length) {
                            var bounds = new google.maps.LatLngBounds();
                            _.forEach($scope.markers, (marker) => {
                                var position = new google.maps.LatLng(marker.coords.latitude, marker.coords.longitude);
                                bounds.extend(position);
                            });

                            var neLat = bounds.getNorthEast().lat();
                            var neLng = bounds.getNorthEast().lng();

                            var swLat = bounds.getSouthWest().lat();
                            var swLng = bounds.getSouthWest().lng();

                            $scope.bd = {
                                northeast: {
                                    latitude: neLat,
                                    longitude: neLng
                                },
                                southwest: {
                                    latitude: swLat,
                                    longitude: swLng
                                }
                            };
                        }
                    });
                }, 500);
            }

            $scope.openFilterDialog = function () {
                $scope.mapFilterDialog.show();
            }

            $scope.closeFilterDialog = function () {
                $scope.mapFilterDialog.hide();
            }

            $scope.applyFilter = function () {
                $scope.reloadMap(true);
                $scope.closeFilterDialog();
            }

            $scope.resetFilter = function () {
                _.forEach($scope.threads, function (thread) {
                    thread.isSelected = true;
                });

                $scope.reloadMap();
                $scope.closeFilterDialog();
            }

            $scope.activate = function () {
                $ionicModal.fromTemplateUrl('partials/map-view-filter-dialog.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    $scope.mapFilterDialog = modal;
                });

                $scope.loadData().then(function (res) {
                    var threads = res[0];
                    var surveys = res[1];

                    _.forEach(threads, function (t) { t.isSelected = true; });

                    $scope.threads = threads;
                    $scope.surveys = surveys;

                    $scope.reloadMap();
                });
            }

            $scope.activate();
        }
    ]);
}());