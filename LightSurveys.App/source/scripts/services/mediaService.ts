/// <reference path="../../../scripts/typings/cordova/plugins/mediacapture.d.ts" />
/// <reference path="../../../scripts/typings/cordova/plugins/camera.d.ts" />

module App.Services {
    "use strict";

    export interface IMediaService {
        captureImage: () => ng.IPromise<Models.Attachment>;
        addFromLibrary: () => ng.IPromise<Models.Attachment>;
        recordVideo: () => ng.IPromise<Models.Attachment>
    }

    class MediaService implements IMediaService {
        static $inject: string[] = ['$q', 'storageService'];

        constructor(
            private $q: angular.IQService,
            private storageService: IStorageService) {
        }

        addFromLibrary(): ng.IPromise<Models.Attachment> {
            var q = this.$q.defer<Models.Attachment>();

            if (!navigator.camera) {
                q.resolve(null);
                return q.promise;
            }

            this.storageService.save('media-capture-meta', 'metadata', 'capture-in-progress', 'true').then((res) => { });

            navigator.camera.getPicture(
                (fileUri: string) => {
                    this.storageService.getFileEntryFromUri(fileUri).then(
                        (fileEntry) => {
                            fileEntry.file(
                                (file) => {
                                    var mimeType = file.type;
                                    if (mimeType === null)
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

            if (!navigator.device) {
                q.resolve(null);
                return q.promise;
            }

            this.storageService.save('media-capture-meta', 'metadata', 'capture-in-progress', 'true').then((res) => { });

            navigator.device.capture.captureImage(
                (mediaFiles) => {
                    var attachment = <Models.Attachment>{
                        fileUri: mediaFiles[0].fullPath,
                        tempStorage: true,
                        type: mediaFiles[0].type,
                        mediaType: _.split(mediaFiles[0].type, '/')[0],
                    }
                    q.resolve(attachment);
                },
                (message) => {
                    q.reject(message);
                }, { limit: 1 });

            return q.promise;
        }

        recordVideo(): ng.IPromise<Models.Attachment> {
            var q = this.$q.defer<Models.Attachment>();

            if (!navigator.device) {
                q.resolve(null);
                return q.promise;
            }

            this.storageService.save('media-capture-meta', 'metadata', 'capture-in-progress', 'true').then((res) => { });

            navigator.device.capture.captureVideo(
                (mediaFiles) => {
                    var attachment = <Models.Attachment>{
                        fileUri: mediaFiles[0].fullPath,
                        tempStorage: true,
                        type: mediaFiles[0].type,
                        mediaType: _.split(mediaFiles[0].type, '/')[0],
                    }
                    q.resolve(attachment);
                },
                (message) => {
                    q.reject(message);
                }, { limit: 1 });

            return q.promise;
        }

        private getMimeType(ext: string) {
            if (ext === 'jpg') return 'image/jpeg';
            if (ext === 'png') return 'image/png';
            if (ext === 'mp4') return 'video/mp4';
            if (ext === 'm3u8') return 'video/MP2T';
            if (ext === 'ts') return 'application/x-mpegURL';
            if (ext === 'mov') return 'video/video/quicktime';
        }
    }

    angular.module('lm.surveys').service('mediaService', MediaService);

}