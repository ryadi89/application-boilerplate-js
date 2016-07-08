define([
  "dojo/_base/declare",

  "dojo/dom",
  "dojo/dom-attr",
  "dojo/dom-class",

  "esri/Camera",

  "esri/geometry/Point",
  "esri/geometry/SpatialReference",

  "esri/portal/PortalItem",

  "esri/views/SceneView",

  "esri/WebScene",

  "dojo/domReady!"
], function (
  declare,
  dom, domAttr, domClass,
  Camera,
  Point, SpatialReference,
  PortalItem,
  SceneView,
  WebScene
) {

  //--------------------------------------------------------------------------
  //
  //  Static Variables
  //
  //--------------------------------------------------------------------------

  var CSS = {
    loading: "app-bp--loading",
    error: "app-bp--error"
  };

  return declare(null, {

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    config: {},

    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------


    startup: function (config) {
      this.config = config;
      if (config) {
        this._setDirection();
        this._createWebScene();
      }
      else {
        var error = new Error("Main:: Config is not defined");
        this.reportError(error);
      }
    },

    reportError: function (error) {
      // remove loading class from body
      domClass.remove(document.body, CSS.loading);
      domClass.add(document.body, CSS.error);
      // an error occurred - notify the user. In this example we pull the string from the
      // resource.js file located in the nls folder because we've set the application up
      // for localization. If you don't need to support multiple languages you can hardcode the
      // strings here and comment out the call in index.html to get the localization strings.
      // set message
      var node = dom.byId("loading_message");
      if (node) {
        if (this.config && this.config.i18n) {
          node.innerHTML = this.config.i18n.scene.error + ": " + error.message;
        }
        else {
          node.innerHTML = "Unable to create scene: " + error.message;
        }
      }
      return error;
    },

    //--------------------------------------------------------------------------
    //
    //  Private Methods
    //
    //--------------------------------------------------------------------------

    _setDirection: function () {
      var dirNode = document.getElementsByTagName("html")[0];
      if (this.config.i18n && this.config.i18n.direction === "rtl") {
        domAttr.set(dirNode, "dir", "rtl");
      }
      else {
        domAttr.set(dirNode, "dir", "ltr");
      }
    },

    // create a scene based on the input web scene id
    _createWebScene: function () {
      // Create a scene from json will be coming.
      // for now scene from id only.
      var scene;
      if (this.config.itemInfo) {
        scene = WebScene.fromJSON(this.config.itemInfo);
      }
      else {
        scene = new WebScene({
          portalItem: new PortalItem({
            id: this.config.webscene
          })
        });
      }
      var viewProperties = {
        map: scene,
        container: "viewDiv"
      };
      if (this.config.components) {
        viewProperties.ui = {
          components: this.config.components.split(",")
        };
      }
      var camera = this._setCameraViewpoint();
      if (camera) {
        viewProperties.camera = camera;
      }
      var view = new SceneView(viewProperties);
      view.then(function (response) {
        domClass.remove(document.body, CSS.loading);
        document.title = scene.portalItem.title;
      }.bind(this), this.reportError);
    },

    _setCameraViewpoint: function () {
      var viewpointParamString = this.config.viewpoint;
      var viewpointArray = viewpointParamString && viewpointParamString.split(";");
      if (!viewpointArray || !viewpointArray.length) {
        return;
      }
      else {
        var cameraString = "";
        var tiltHeading = "";
        for (var i = 0; i < viewpointArray.length; i++) {
          if (viewpointArray[i].indexOf("cam:") !== -1) {
            cameraString = viewpointArray[i];
          }
          else {
            tiltHeading = viewpointArray[i];
          }
        }
        if (cameraString !== "") {
          cameraString = cameraString.substr(4, cameraString.length - 4);
          var positionArray = cameraString.split(",");
          if (positionArray.length >= 3) {
            var x = 0,
              y = 0,
              z = 0;
            x = parseFloat(positionArray[0]);
            y = parseFloat(positionArray[1]);
            z = parseFloat(positionArray[2]);
            var sr = SpatialReference.WGS84;
            if (positionArray.length === 4) {
              sr = new SpatialReference(parseInt(positionArray[3], 10));
            }
            var cameraPosition = new Point(x, y, z, sr);
            var heading = 0,
              tilt = 0;
            if (tiltHeading !== "") {
              var tiltHeadingArray = tiltHeading.split(",");
              if (tiltHeadingArray.length >= 0) {
                heading = parseFloat(tiltHeadingArray[0]);
                if (tiltHeadingArray.length > 1) {
                  tilt = parseFloat(tiltHeadingArray[1]);
                }
              }
            }
            var camera = new Camera({
              position: cameraPosition,
              heading: heading,
              tilt: tilt
            });
            return camera;
          }
        }
      }
    }
  });
});