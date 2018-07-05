declare var Chart: any;

((): void => {
    "use strict";

    angular.module("lm.surveys")
        .config(ConfigIonic)
        .config(ConfigRoutes)
        .config(ConfigToastr)
        .config(ConfigHttpProvider)
        .config(ConfigCalendar);

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
                templateUrl: "partials/home.html",
                cache: false
            })
            .state('login', {
                url: "/login?rejected",
                controller: "loginController",
                templateUrl: "partials/login.html",
                data: { cssClassnames: "login-page" },
                cache: false
            })
            .state('forgotPassword', {
                url: "/forgot-password",
                controller: "forgotPasswordController",
                templateUrl: "partials/forgot-password.html",
                data: { cssClassnames: "forgot-password-page" },
                cache: false
            })
            .state('register', {
                url: "/register",
                controller: "registerController",
                templateUrl: "partials/register.html",
                cache: false
            })
            .state('registerComplete', {
                url: '/register-complete',
                controller: 'registerCompleteController',
                templateUrl: 'partials/register-complete.html',
                cache: false
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
                templateUrl: "partials/calendar.html",
                cache: false
            })
            .state('timeline', {
                parent: 'menu',
                url: "/timeline",
                controller: "timelineController",
                templateUrl: "partials/timeline.html",
                cache: false
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
            .state('settings', {
                parent: 'menu',
                url: "/settings",
                controller: "settingsController",
                templateUrl: "partials/settings.html"
            })
            // .state('subscriptions', {
            //     parent: 'menu',
            //     url: '/subscriptions',
            //     controller: 'subscriptionsController',
            //     templateUrl: 'partials/subscriptions.html'
            // })
            // .state('addSubscription', {
            //     parent: 'menu',
            //     url: '/account',
            //     controller: 'addSubscriptionController',
            //     templateUrl: 'partials/add-subscription.html'
            // })
            .state('feedback', {
                parent: 'menu',
                url: "/feedback",
                controller: "feedbackController",
                templateUrl: "partials/feedback.html"
            })
            .state('guidance', {
                parent: 'menu',
                url: '/guidance',
                controller: 'guidanceController',
                templateUrl: 'partials/guidance/index.html'
            })
            .state('userAgreement', {
                parent: 'menu',
                url: '/guidance/user-agreement',
                controller: 'staticContentController',
                templateUrl: 'partials/guidance/user-agreement.html'
            })
            .state('privacyPolicy', {
                parent: 'menu',
                url: '/guidance/privacy-policy',
                controller: 'staticContentController',
                templateUrl: 'partials/guidance/privacy-policy.html'
            })
            .state('acceptableUsePolicy', {
                parent: 'menu',
                url: '/guidance/privacy-policy',
                controller: 'staticContentController',
                templateUrl: 'partials/guidance/acceptable-use-policy.html'
            })
            .state('gatherEvidence', {
                parent: 'menu',
                url: '/guidance/gather-evidence',
                controller: 'staticContentController',
                templateUrl: 'partials/guidance/gather-evidence.html'
            })
            .state('makingRecords', {
                parent: 'menu',
                url: '/guidance/making-records',
                controller: 'staticContentController',
                templateUrl: 'partials/guidance/making-records.html'
            })
            .state('account', {
                parent: 'menu',
                url: '/account',
                controller: 'accountController',
                templateUrl: 'partials/account.html'
            })
            .state('organizations', {
               parent: 'menu',
               url: '/organizations',
               controller: 'organizationsController',
               templateUrl: 'partials/organizations.html' 
            })
            .state('adviceThreads', {
                parent: 'menu',
                url: '/advice-threads',
                controller: 'adviceThreadsController',
                templateUrl: 'partials/advice-threads.html'
            });

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
})();