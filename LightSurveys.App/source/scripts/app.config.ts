declare var Chart: any;

((): void => {
    "use strict";

    angular.module("lm.surveys")
        .config(ConfigIonic)
        .config(ConfigRoutes)
        .config(ConfigToastr)
        .config(ConfigHttpProvider)
        .config(ConfigCalendar)
        .config(ConfigChartJs);

    ConfigRoutes.$inject = ["$stateProvider", "$urlRouterProvider"];
    function ConfigRoutes($stateProvider: angular.ui.IStateProvider, $urlRouterProvider: angular.ui.IUrlRouterProvider) {

        $stateProvider
            .state('menu', {
                abstract: true,
                url: '',
                controller: 'menuController',
                templateUrl: 'partials/menu.html'
            })
            .state('home', {
                url: '/home',
                parent: 'menu',
                controller: "homeController",
                templateUrl: "partials/home.html"
            })
            .state('login', {
                url: "/login?rejected",
                controller: "loginController",
                templateUrl: "partials/login.html",
                data: { cssClassnames: "login-page" }
            })
            .state('register', {
                url: "/register",
                controller: "registerController",
                templateUrl: "partials/register.html"
            })
            .state('survey', {
                parent: 'menu',
                url: "/survey/:id",
                controller: "surveyController",
                templateUrl: "partials/survey.html"
            })
            .state('surveyView', {
                parent: 'menu',
                url: "/surveyView/:id",
                controller: "surveyController",
                templateUrl: "partials/surveyView.html"
            })
            .state('drafts', {
                parent: 'menu',
                url: "/drafts/:id",
                controller: "draftsController",
                templateUrl: "partials/drafts.html"
            })
            .state('projects', {
                url: "/projects",
                controller: "selectProjectController",
                templateUrl: "partials/selectProject.html"
            })
            .state('calendar', {
                parent: 'menu',
                url: "/calendar",
                controller: "calendarController",
                templateUrl: "partials/calendar.html"
            })
            .state('timeline', {
                parent: 'menu',
                url: "/timeline",
                controller: "timelineController",
                templateUrl: "partials/timeline.html"
            })
            .state('cloneTemplate', {
                parent: 'menu',
                url: "/cloneTemplate/:id",
                controller: "cloneTemplateController",
                templateUrl: "partials/formTemplate.html"
            })
            .state('editTemplate', {
                parent: 'menu',
                url: "/editTemplate/:id",
                controller: "editTemplateController",
                templateUrl: "partials/formTemplate.html"
            })

        $urlRouterProvider.otherwise('/home');
    }

    ConfigIonic.$inject = ["$ionicConfigProvider", "$compileProvider"];
    function ConfigIonic($ionicConfigProvider: ionic.utility.IonicConfigProvider, $compileProvider) {
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|content|blob|ms-appx|x-wmapp0):|data:image\//)
        $ionicConfigProvider.views.maxCache(0);
    }

    ConfigToastr.$inject = ["toastrConfig"];
    function ConfigToastr(toastrConfig: ToastrOptions) {
        angular.extend(toastrConfig, {
            positionClass: 'toast-bottom-center'
        });
    }

    ConfigHttpProvider.$inject = ["$httpProvider"];
    function ConfigHttpProvider($httpProvider: ng.IHttpProvider) {
        $httpProvider.interceptors.push('authInterceptorService');
    }

    ConfigCalendar.$inject = ["calendarConfig"];
    function ConfigCalendar(calendarConfig: any) {
        calendarConfig.dateFormats.weekDay = 'EEE'
    }

    function ConfigChartJs() {
        /* groupableBar implementation */
        /* *************************** */
        Chart.defaults.groupableBar = Chart.helpers.clone(Chart.defaults.bar);

        var helpers = Chart.helpers;
        Chart.controllers.groupableBar = Chart.controllers.bar.extend({
            calculateBarX: function (index, datasetIndex) {
                // position the bars based on the stack index
                var stackIndex = this.getMeta().stackIndex;
                return Chart.controllers.bar.prototype.calculateBarX.apply(this, [index, stackIndex]);
            },

            hideOtherStacks: function (datasetIndex) {
                var meta = this.getMeta();
                var stackIndex = meta.stackIndex;

                this.hiddens = [];
                for (var i = 0; i < datasetIndex; i++) {
                    var dsMeta = this.chart.getDatasetMeta(i);
                    if (dsMeta.stackIndex !== stackIndex) {
                        this.hiddens.push(dsMeta.hidden);
                        dsMeta.hidden = true;
                    }
                }
            },

            unhideOtherStacks: function (datasetIndex) {
                var meta = this.getMeta();
                var stackIndex = meta.stackIndex;

                for (var i = 0; i < datasetIndex; i++) {
                    var dsMeta = this.chart.getDatasetMeta(i);
                    if (dsMeta.stackIndex !== stackIndex) {
                        dsMeta.hidden = this.hiddens.unshift();
                    }
                }
            },

            calculateBarY: function (index, datasetIndex) {
                this.hideOtherStacks(datasetIndex);
                var barY = Chart.controllers.bar.prototype.calculateBarY.apply(this, [index, datasetIndex]);
                this.unhideOtherStacks(datasetIndex);
                return barY;
            },

            calculateBarBase: function (datasetIndex, index) {
                this.hideOtherStacks(datasetIndex);
                var barBase = Chart.controllers.bar.prototype.calculateBarBase.apply(this, [datasetIndex, index]);
                this.unhideOtherStacks(datasetIndex);
                return barBase;
            },

            getBarCount: function () {
                var stacks = [];

                // put the stack index in the dataset meta
                Chart.helpers.each(this.chart.data.datasets, function (dataset, datasetIndex) {
                    var meta = this.chart.getDatasetMeta(datasetIndex);
                    if (meta.bar && this.chart.isDatasetVisible(datasetIndex)) {
                        var stackIndex = stacks.indexOf(dataset.stack);
                        if (stackIndex === -1) {
                            stackIndex = stacks.length;
                            stacks.push(dataset.stack);
                        }
                        meta.stackIndex = stackIndex;
                    }
                }, this);

                this.getMeta().stacks = stacks;
                return stacks.length;
            },
        });
    }
})();