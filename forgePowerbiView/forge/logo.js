"use strict"
class LogoExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);
  }
  adjustLogo(){
    let vdiv = $('.adsk-viewing-viewer')[0];
    $('#canvas-align').width(vdiv.clientWidth).height(vdiv.clientHeight);
    $('#logo-overlay').width(vdiv.clientWidth).height(vdiv.clientHeight);
  }
  load() {
    console.log("Logo cargado")
    let onresize = debounce(() => {
      this.adjustLogo();
    }, 100);

    window.addEventListener('resize', onresize);
    let logo = $('#logo');
    let width = 80;
    let height = 80;
    logo.html('<img width=\'' + width + 'px\' height=\'' + height + 'px\' src=\'/assets/icon.png\'>');
    this.adjustLogo();
    $('#logo-overlay').attr('display', 'block');
    return true;
  }
  unload(){
    console.log('LogoExtension unloaded');
    $('#logo-overlay').attr('display', 'none');
    return true;
  }
}

function debounce(func, wait, immediate) {
  let timeout
  return function () {
    let context = this;
    let args = arguments;
    let later = function (){
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };
    let callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      func.apply(context, args);
    }
  };
};

Autodesk.Viewing.theExtensionManager.registerExtension('LogoExtension-MAM', LogoExtension);