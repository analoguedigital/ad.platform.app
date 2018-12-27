/// <reference path="../../../../scripts/typings/ionic/ionic.d.ts" />

(function () {
    'use strict';
    angular.module('lm.surveys').controller('attachmentMetricController', ['$scope', '$sce', '$rootScope', '$timeout', 'mediaService',
        '$ionicModal', '$ionicActionSheet', '$controller', 'userService', 'Upload', 'localStorageService', 'httpService',
        function ($scope, $sce, $rootScope, $timeout, mediaService, $ionicModal, $ionicActionSheet, $controller, userService, Upload, localStorageService, httpService) {

            $controller('metricController', {
                $scope: $scope
            });

            $rootScope.$on('refresh-survey-attachments', function (event, survey) {
                var formValueId = $scope.formValue.id;
                var updatedValue = _.filter(survey.formValues, function (fv) {
                    return fv.id == formValueId;
                });

                if (updatedValue && updatedValue.length) {
                    var newFormValue = updatedValue[0];

                    _.forEach(newFormValue.attachments, function (attachment) {
                        attachment.fileUri = undefined;
                        attachment.mediaType = _.toLower(attachment.typeString);
                        delete attachment.typeString;
                    });

                    $scope.formValue.attachments = newFormValue.attachments;
                }
            });

            var uploadInstance;
            var uploadIndex = 0;

            $scope.currentMedia = undefined;
            $scope.currentMediaDuration = undefined;

            if (_.isEmpty($scope.formValues)) {
                $scope.formValue = $scope.addFormValue($scope.metric, $scope.dataListItem, $scope.rowNumber);
                $scope.formValue.attachments = [];
            } else {
                $scope.formValue = $scope.formValues[0];
            }

            if ($scope.formValue.textValue === undefined)
                $scope.formValue.textValue = '';

            $scope.playAudio = function (attachment) {
                if ($scope.currentMedia)
                    $scope.currentMedia.play();
                else {
                    var baseUrl = httpService.getServiceBase();
                    var _url;
                    if (attachment.fileUri && attachment.fileUri.length)
                        _url = attachment.fileUri;
                    else if (attachment.oneTimeAccessId && attachment.oneTimeAccessId.length)
                        _url = baseUrl + 'api/downloads/' + attachment.oneTimeAccessId;

                    try {
                        var media = new Media(_url, function () {}, function (err) {});

                        $scope.currentMedia = media;
                        $rootScope.currentMedia = media;
                        $rootScope.mediaModal = $scope.modal;

                        var counter = 0;
                        var timeDuration = setInterval(function () {
                            counter = counter + 100;
                            if (counter > 2000)
                                clearInterval(timeDuration);

                            var duration = media.getDuration();
                            if (duration > 0) {
                                clearInterval(timeDuration);
                                $scope.currentMediaDuration = _.round(duration, 1);
                            }
                        }, 100);

                        media.play();
                    } catch (e) {
                        console.warn(e);
                    }
                }
            };

            $scope.pauseAudio = function () {
                if ($scope.currentMedia)
                    $scope.currentMedia.pause();
            };

            $scope.stopPlayback = function () {
                if ($scope.currentMedia) {
                    $scope.currentMedia.stop();
                    $scope.currentMedia.release();
                }

                $scope.currentMedia = undefined;
                $scope.currentMediaDuration = undefined;
            };

            $scope.slideChanged = function (index) {
                if ($scope.currentMedia) {
                    $scope.currentMedia.stop();
                    $scope.currentMedia.release();
                }

                $scope.currentMedia = undefined;
                $scope.currentMediaDuration = undefined;
            };

            $scope.startCapture = function () {
                var i = 2;

                var actionButtons = [{
                        text: 'Take photo'
                    },
                    {
                        text: 'From library'
                    },
                    {
                        text: 'Record video'
                    },
                    {
                        text: 'Record audio'
                    }
                ];

                if (ionic.Platform.isAndroid()) {
                    actionButtons.push({
                        text: 'Choose a file'
                    });
                }

                if (ionic.Platform.isIOS()) {
                    actionButtons.push({
                        text: 'Choose from iCloud'
                    });
                }

                var hideSheet = $ionicActionSheet.show({
                    buttons: actionButtons,
                    titleText: 'Select source',
                    cancelText: 'Cancel',
                    cancel: function () {
                        // add cancel code.
                        console.log('startCapture cancelled by user');
                    },
                    buttonClicked: function (index) {
                        switch (index) {
                            case 0:
                                mediaService.captureImage().then($scope.addAttachment);
                                break;
                            case 1:
                                mediaService.addFromLibrary().then($scope.addAttachment);
                                break;
                            case 2:
                                mediaService.recordVideo().then($scope.addAttachment);
                                break;
                            case 3:
                                {
                                    mediaService.recordAudio().then($scope.addAttachment);
                                    break;
                                }
                            case 4:
                                {
                                    if (ionic.Platform.isAndroid()) {
                                        mediaService.chooseFile().then($scope.addAttachment);
                                    } else if (ionic.Platform.isIOS()) {
                                        mediaService.pickFromICloud().then($scope.addAttachment);
                                    }
                                    break;
                                }
                        }

                        return true;
                    }
                });
            };

            $scope.startAudioCapture = function () {
                mediaService.recordAudio().then($scope.addAttachment);
            };

            $scope.startVideoCapture = function () {
                mediaService.recordVideo().then($scope.addAttachment);
            };

            $scope.addAttachment = function (attachment) {
                $timeout(function () {
                    $scope.formValue.attachments.push(attachment);
                }, 100);
            };

            $scope.deleteAttachment = function (attachment) {
                var hideSheet = $ionicActionSheet.show({
                    buttons: [{
                        text: 'Yes, delete it'
                    }],
                    titleText: 'Do you want to remove this attachment?',
                    cancelText: 'Cancel',
                    buttonClicked: function (index) {
                        _.remove($scope.formValue.attachments, function (item) {
                            return item.fileUri === attachment.fileUri;
                        });
                        return true;
                    }
                });
            };

            $scope.showImages = function (index) {
                $scope.activeSlide = index;
                $scope.showModal('partials/imagePopover.html');
            };

            $scope.showModal = function (templateUrl) {
                $ionicModal.fromTemplateUrl(templateUrl, {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    $scope.modal = modal;
                    $scope.modal.show();
                });
            };

            // Close the modal
            $scope.closeModal = function () {
                $scope.stopPlayback();
                $scope.modal.hide();
                $scope.modal.remove();
            };

            $scope.showPdfModal = function () {
                $ionicModal.fromTemplateUrl('partials/documentModal.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    $scope.pdfDocumentModal = modal;
                    $scope.pdfDocumentModal.show();
                });
            };

            $scope.getDownloadUrl = function (attachment) {
                var baseUrl = httpService.getServiceBase();
                var url;

                if (attachment.fileUri && attachment.fileUri.length)
                    url = attachment.fileUri;
                else if (attachment.oneTimeAccessId && attachment.oneTimeAccessId.length)
                    url = baseUrl + 'api/downloads/' + attachment.oneTimeAccessId;

                return $sce.trustAsResourceUrl(url);
            };

            $scope.openDocument = function (attachment) {
                var fileName = attachment.fileName;
                var fileExt = fileName.substr(fileName.length - 3, 3);

                var downloadUrl = $scope.getDownloadUrl(attachment);
                var gdocsUrl = 'http://docs.google.com/gview?embedded=true&url=';

                var url = $sce.trustAsResourceUrl(gdocsUrl + downloadUrl);

                $scope.pdfDocumentUrl = url;
                $scope.showPdfModal();
            };

            $scope.closePdfModal = function () {
                $scope.pdfDocumentModal.hide();
                $scope.pdfDocumentModal.remove();
            };

            //$scope.uploadFiles = function () {
            //    if (uploadIndex < $scope.files.length && !uploadInstance) {
            //        var file = $scope.files[uploadIndex];
            //        uploadInstance = Upload.upload({
            //            url: App.Services.HttpService.serviceBase + 'api/files',
            //            method: 'POST',
            //            //  file:file,
            //            data: { file: file }
            //        }).progress(function (evt) {
            //            file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total + ''));
            //        }).success(function (response) {
            //            uploadIndex++;
            //            uploadInstance = null;
            //            $scope.uploadFiles();
            //            if ($scope.formValue.textValue.length > 0)
            //                $scope.formValue.textValue += ',';
            //            $scope.formValue.textValue += response;
            //            $scope.formValue.attachments.push({ name: file.name, type: file.type, mediaType: _.split(file.type, '/')[0], localPath: '' }); //type: image/png, ...
            //            file.guid = response;

            //        }).error(function (response) {
            //            if (response.status > 0)
            //                $scope.errorMsg = response.status + ': ' + response.data;
            //        });
            //    }

            //};

            //$scope.abort = function () {
            //    if (uploadInstance) {
            //        uploadInstance.abort();
            //        uploadInstance = null;
            //        $scope.files = $scope.files.slice(0, uploadIndex);
            //    }
            //};

            //$scope.abortForOneFile = function (index) {
            //    if (uploadIndex === index) {
            //        uploadInstance.abort();
            //        uploadInstance = null;
            //    }
            //    $scope.files.splice(index, 1);
            //    $scope.files = $scope.files.slice(0);
            //    $scope.uploadFiles();
            //};

            //$scope.validateFile = function ($file) {
            //    //$file.$error = "eelo";
            //};

            //$scope.deleteAttachment = function (attachment) {
            //    _.find($scope.formValue.attachments, { 'id': attachment.id }).isDeleted = true;
            //};

            //$scope.deleteFile = function (index) {
            //    var file = $scope.files.splice(index);
            //    $scope.files.splice(index);
            //    var updatedGuids = $scope.formValue.textValue.split(',');
            //    _.remove(updatedGuids, function (g) { return g === file[0].guid; });
            //    $scope.formValue.textValue = updatedGuids.join(',');
            //};
        }
    ]);
}());