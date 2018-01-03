/// <reference path="../../../scripts/typings/cordova/plugins/mediacapture.d.ts" />
/// <reference path="../../../scripts/typings/cordova/plugins/camera.d.ts" />

declare var FilePicker: any;
declare var fileChooser: any;

module App.Services {
    "use strict";

    export interface IMediaService {
        captureImage: () => ng.IPromise<Models.Attachment>;
        addFromLibrary: () => ng.IPromise<Models.Attachment>;
        recordVideo: () => ng.IPromise<Models.Attachment>;
        recordAudio: () => ng.IPromise<Models.Attachment>;
        isCaptureInProgress: () => boolean;
    }

    class MediaService implements IMediaService {
        static $inject: string[] = ['$q', 'localStorageService', 'storageService'];

        constructor(
            private $q: angular.IQService,
            private localStorageService: angular.local.storage.ILocalStorageService,
            private storageService: IStorageService) {
        }

        isCaptureInProgress(): boolean {
            if (this.localStorageService.get<boolean>('capture-in-progress'))
                return true;

            return false;
        }

        chooseFile(): ng.IPromise<Models.Attachment> {
            var self = this;

            var q = this.$q.defer<Models.Attachment>();

            // Uncomment the following to use the file-picker plugin, for iCloud access.
            //FilePicker.isAvailable((avail) => {
            //    console.warn(avail ? "FilePicker is available" : "FilePicker is not available!");

            //    var utis = ["public.data", "public.audio"];
            //    FilePicker.pickFile((res) => {
            //        console.log('result', res);
            //    }, (err) => {
            //        console.error(err);
            //    }, utis);
            //});

            this.startCapture();

            fileChooser.open(function (uri) {
                self.endCapture();
                console.warn('URI', uri);

                self.storageService.getFileEntryFromUri(uri).then(
                    (fileEntry) => {
                        console.warn('entry', fileEntry);

                        fileEntry.file(
                            (file) => {
                                var mimeType = file.type;
                                if (!mimeType)
                                    mimeType = this.getMimeType(uri.split('.').pop());

                                q.resolve(<Models.Attachment>{
                                    fileUri: uri,
                                    type: mimeType,
                                    mediaType: _.split(mimeType, '/')[0],
                                    tempStorage: true
                                });
                            },
                            (err) => {
                                q.reject(err);
                            }
                        )
                    },
                    (err) => { q.reject(err); })
            }, function (err) {
                self.endCapture();

                console.error(err);
                q.reject(err);
            });

            return q.promise;
        }

        addFromLibrary(): ng.IPromise<Models.Attachment> {
            var q = this.$q.defer<Models.Attachment>();

            if (!navigator.camera) {
                q.resolve(null);
                return q.promise;
            }

            this.startCapture();

            navigator.camera.getPicture(
                (fileUri: string) => {
                    this.endCapture();
                    this.storageService.getFileEntryFromUri(fileUri).then(
                        (fileEntry) => {
                            fileEntry.file(
                                (file) => {
                                    var mimeType = file.type;
                                    if (!mimeType)
                                        mimeType = this.getMimeType(fileUri.split('.').pop());
                                    q.resolve(<Models.Attachment>{
                                        fileUri: fileUri,
                                        type: mimeType,
                                        mediaType: _.split(mimeType, '/')[0],
                                        tempStorage: true
                                    });
                                },
                                (err) => {
                                    q.reject(err);
                                }
                            )
                        },
                        (err) => { q.reject(err); })
                },
                (err: string) => {
                    this.endCapture();
                    q.reject(err);
                },
                {
                    sourceType: Camera.PictureSourceType.PHOTOLIBRARY
                });


            //navigator.device.capture.captureImage(
            //    (mediaFiles) => {
            //        var attachment = <Models.Attachment>{
            //            fileUri: mediaFiles[0].fullPath,
            //            tempStorage: true,
            //            type: mediaFiles[0].type,
            //            mediaType: _.split(mediaFiles[0].type, '/')[0],
            //        }
            //        q.resolve(attachment);
            //    },
            //    (message) => {
            //        q.reject(message);
            //    }, { limit: 1 });

            return q.promise;
        }

        captureImage(): ng.IPromise<Models.Attachment> {
            var q = this.$q.defer<Models.Attachment>();

            //if (!navigator.device) {
            //    q.resolve(null);
            //    return q.promise;
            //}

            //this.startCapture();

            //navigator.device.capture.captureImage(
            //    (mediaFiles) => {
            //        this.endCapture();
            //        var attachment = <Models.Attachment>{
            //            fileUri: mediaFiles[0].fullPath,
            //            tempStorage: true,
            //            type: mediaFiles[0].type,
            //            mediaType: _.split(mediaFiles[0].type, '/')[0],
            //        }
            //        q.resolve(attachment);
            //    },
            //    (message) => {
            //        this.endCapture();
            //        q.reject(message);
            //    }, { limit: 1 });

            if (!navigator.camera) {
                q.resolve(null);
                return q.promise;
            }

            this.startCapture();

            navigator.camera.getPicture(
                (fileUri: string) => {
                    this.endCapture();
                    this.storageService.getFileEntryFromUri(fileUri).then(
                        (fileEntry) => {
                            fileEntry.file(
                                (file) => {
                                    var mimeType = file.type;
                                    if (!mimeType)
                                        mimeType = this.getMimeType(fileUri.split('.').pop());
                                    q.resolve(<Models.Attachment>{
                                        fileUri: fileUri,
                                        type: mimeType,
                                        mediaType: _.split(mimeType, '/')[0],
                                        tempStorage: true
                                    });
                                },
                                (err) => {
                                    q.reject(err);
                                }
                            )
                        },
                        (err) => { q.reject(err); })
                },
                (err: string) => {
                    this.endCapture();
                    q.reject(err);
                },
                {
                    sourceType: Camera.PictureSourceType.CAMERA,
                    destinationType: Camera.DestinationType.FILE_URI
                });


            return q.promise;
        }

        recordVideo(): ng.IPromise<Models.Attachment> {
            var q = this.$q.defer<Models.Attachment>();

            if (!navigator.device) {
                q.resolve(null);
                return q.promise;
            }

            this.startCapture();

            navigator.device.capture.captureVideo(
                (mediaFiles) => {
                    this.endCapture();
                    var mimeType = mediaFiles[0].type;
                    if (!mimeType)
                        mimeType = this.getMimeType(mediaFiles[0].name.split('.').pop());

                    var attachment = <Models.Attachment>{
                        fileUri: mediaFiles[0].fullPath,
                        tempStorage: true,
                        type: mimeType,
                        mediaType: _.split(mimeType, '/')[0]
                    };
                    q.resolve(attachment);
                },
                (message) => {
                    this.endCapture();
                    q.reject(message);
                }, { limit: 1 });

            return q.promise;
        }

        recordAudio(): ng.IPromise<Models.Attachment> {
            var q = this.$q.defer<Models.Attachment>();

            if (!navigator.device) {
                q.resolve(null);
                return q.promise;
            }

            this.startCapture();

            navigator.device.capture.captureAudio(
                (mediaFiles) => {
                    this.endCapture();
                    var mimeType = mediaFiles[0].type;
                    if (!mimeType)
                        mimeType = this.getMimeType(mediaFiles[0].name.split('.').pop());

                    var attachment = <Models.Attachment>{
                        fileUri: mediaFiles[0].fullPath,
                        tempStorage: true,
                        type: mimeType,
                        mediaType: _.split(mimeType, '/')[0]
                    };
                    q.resolve(attachment);
                }, (message) => {
                    this.endCapture();
                    q.reject(message);
                }, { limit: 1 }
            );

            return q.promise;
        }

        private startCapture() {
            this.localStorageService.set<boolean>('capture-in-progress', true);
        }

        private endCapture() {
            this.localStorageService.set<boolean>('capture-in-progress', false);
        }

        private getMimeType(extension: string) {
            var ext = extension.toLowerCase();

            if (ext === 'jpg') return 'image/jpeg';
            if (ext === 'png') return 'image/png';
            if (ext === 'mp4') return 'video/mp4';
            if (ext === 'm3u8') return 'video/MP2T';
            if (ext === 'ts') return 'application/x-mpegURL';
            if (ext === 'mov') return 'video/quicktime';
            if (ext === 'wav') return 'audio/wav';
            if (ext === 'amr') return 'audio/amr';
        }
    }

    angular.module('lm.surveys').service('mediaService', MediaService);

}