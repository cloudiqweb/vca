/**
 * System configuration for Angular samples
 * Adjust as necessary for your application needs.
 */
(function (global) {
  var angular2SemanticUiPackages = [
      'angular2-semantic-ui',
      'angular2-semantic-ui/components/checkbox',
      'angular2-semantic-ui/components/dimmer',
      'angular2-semantic-ui/components/dropdown',
      'angular2-semantic-ui/components/loader',
      'angular2-semantic-ui/components/modal',
      'angular2-semantic-ui/components/progress',
      'angular2-semantic-ui/components/tab',
      'angular2-semantic-ui/components/accordion',
      'angular2-semantic-ui/components/accordion_panel',
      'angular2-semantic-ui/components/popup',
      'angular2-semantic-ui/components/pagination',
      'angular2-semantic-ui/components/tags-input',
      'angular2-semantic-ui/components/rating',
    ];
  var config = {
      paths: {
        // paths serve as alias
        'npm:': 'node_modules/'
      },
      // map tells the System loader where to look for things
      map: {
        // our app is within the app folder
        'app': 'app',

        // angular bundles
        '@angular/core': 'npm:@angular/core/bundles/core.umd.js',
        '@angular/common': 'npm:@angular/common/bundles/common.umd.js',
        '@angular/compiler': 'npm:@angular/compiler/bundles/compiler.umd.js',
        '@angular/platform-browser': 'npm:@angular/platform-browser/bundles/platform-browser.umd.js',
        '@angular/platform-browser/animations': 'npm:@angular/platform-browser/bundles/platform-browser-animations.umd.js',
        '@angular/platform-browser-dynamic': 'npm:@angular/platform-browser-dynamic/bundles/platform-browser-dynamic.umd.js',
        '@angular/http': 'npm:@angular/http/bundles/http.umd.js',
        '@angular/router': 'npm:@angular/router/bundles/router.umd.js',
        '@angular/router/upgrade': 'npm:@angular/router/bundles/router-upgrade.umd.js',
        '@angular/forms': 'npm:@angular/forms/bundles/forms.umd.js',
        '@angular/animations': 'npm:@angular/animations/bundles/animations.umd.js',
        '@angular/animations/browser': 'npm:@angular/animations/bundles/animations-browser.umd.js',
        // other libraries
        'rxjs':                      'npm:rxjs',
        'ng2-modal':'npm:ng2-modal',
        'ng2-semantic-ui': 'npm:ng2-semantic-ui/bundles/ng2-semantic-ui.umd.min.js',
        'angular-in-memory-web-api': 'npm:angular-in-memory-web-api/bundles/in-memory-web-api.umd.js',
        'wijmo': 'npm:wijmo'
      },
      // packages tells the System loader how to load when no filename and/or no extension
      packages: {
        app: {
          main: './main.js',
          defaultExtension: 'js',
          meta: {
            './*.js': {
              loader: 'systemjs-angular-loader.js'
            }
          }
        },
        'rxjs': {
            main: 'bundles/Rx.js',
            defaultExtension: 'js'
        },
        wijmo: {
                  defaultExtension: 'js'
        },
        "ng2-modal": { "main": "index.js", "defaultExtension": "js" },
	      "/angulartics2": {"defaultExtension": "js"}
      }
  };
  angular2SemanticUiPackages.forEach(function (item) {
      config.map[item] = 'npm:' + item;
      config.packages[item] = {
        main: './index.js',
        defaultExtension: 'js'
      }
  });
  System.config(config);
})(this);
