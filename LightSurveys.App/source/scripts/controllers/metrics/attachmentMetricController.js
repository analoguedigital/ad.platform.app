'use strict';
angular.module('lm.surveys').controller('attachmentMetricController', ['$scope', '$timeout', 'mediaService', '$ionicModal', '$ionicActionSheet', '$controller', 'userService', 'Upload',
    function ($scope, $timeout, mediaService, $ionicModal, $ionicActionSheet, $controller, userService, Upload) {

        $controller('metricController', { $scope: $scope });

        if (_.isEmpty($scope.formValues)) {
            $scope.formValue = $scope.addFormValue($scope.metric, $scope.dataListItem, $scope.rowNumber);
            $scope.formValue.attachments = [];
        }
        else {
            $scope.formValue = $scope.formValues[0];
        }

        $scope.playAudio = function (attachment) {
            var media = new Media(attachment.fileUri, function () {
                console.log('media success');
            }, function (err) {
                console.log('media error: ' + err);
            });

            media.play();
        };

        var uploadInstance;
        var uploadIndex = 0;

        if ($scope.formValue.textValue === undefined)
            $scope.formValue.textValue = '';

        $scope.startCapture = function () {
            var i = 2;
            var hideSheet = $ionicActionSheet.show({
                buttons: [
                    { text: 'Take photo' },
                    { text: 'From library' },
                    { text: 'Record video' },
                    { text: 'Record audio' }
                ],
                titleText: 'Select source',
                cancelText: 'Cancel',
                cancel: function () {
                    // add cancel code..
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
                        case 3: {
                            mediaService.recordAudio().then($scope.addAttachment);
                            break;
                        }
                    }

                    return true;
                }
            });
        }

        $scope.addAttachment = function (attachment) {
            $timeout(function () {
                $scope.formValue.attachments.push(attachment);
            }, 10);
        }

        $scope.deleteAttachment = function (attachment) {
            var hideSheet = $ionicActionSheet.show({
                buttons: [
                    { text: 'Delete' }
                ],
                titleText: 'action',
                cancelText: 'Cancel',
                buttonClicked: function (index) {
                    _.remove($scope.formValue.attachments, function (item) { return item.fileUri === attachment.fileUri; });
                    return true;
                }
            });
        }

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

        $scope.showImages = function (index) {
            $scope.activeSlide = index;
            $scope.showModal('partials/imagePopover.html');
        }

        $scope.showModal = function (templateUrl) {
            $ionicModal.fromTemplateUrl(templateUrl, {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.modal = modal;
                $scope.modal.show();
            });
        }

        // Close the modal
        $scope.closeModal = function () {
            $scope.modal.hide();
            $scope.modal.remove()
        };
    }]);

