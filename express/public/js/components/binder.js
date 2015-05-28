// Add persistent bindings between a selector and a model value.  Changes are propagated between the two.
//
// To use this, you should have a "bindings" element in your fluid defaults, as in:
//      bindings: [{
//          selector:    "input",
//          path:        "input",
//          elementType: "text",
//          cookify:     true
//      }]
//
//
// The options are as follows:
// * selector:    A valid selector for your component.
//                Must be able to be resolved using that.locate(selector)
//
// * path:        A valid path for the model variable whose value will be watched.
//                Must be able to be resolved using fluid.get(path)
//
// * elementType: The type of html element (typically form elements) that allows the user to control the value.
//                Only "radio" is meaningful at the moment, as those are handled differently.
//                For everything else, the value is set using element.val(value).
//
//
// To make use of this, you will need to start by sourcing this file after all fluid sources.
//
// In your component, you will need a valid selector, as in:
//
//  selectors: {
//      "input":    ".ptd-search-input"
//  }
//
// You will also need a valid model path, as in:
//
//  model: {
//      input:  ""
//  }
//
// Finally, you will need to invoke the binding applier where it makes sense, for example in response to an event.
// Here's an example that binds to the "onCreate" event:
//
//  listeners: {
//      onCreate: {
//        "funcName": "ctr.components.binder.applyBinding",
//        "args":     "{that}"
//      }
//  }
//
// Once you have done this, model changes should be passed to form controls and vice versa.

/* global fluid, jQuery */
(function ($) {
    "use strict";
    var binder = fluid.registerNamespace("ctr.components.binder");

    binder.setRadioValue = function (element, change) {
        element.each(function (index, option) {
            option.checked = ($(option).val() === change);
        });
    };

    binder.applyBinding = function (that) {
        var bindings = that.options.bindings;
        fluid.each(bindings, function (binding) {
            var element = that.locate(binding.selector);

            var value = fluid.get(that.model, binding.path);

            // initial sync, model overwrites values
            if (binding.elementType === "radio") {
                binder.setRadioValue(element, value);
            }
            else {
                element.val(value);
            }

            // Update the model when the form changes
            element.change(function () {
                console.log("Changing model based on element update.");

                var value = element.val();
                if (binding.elementType === "radio") {
                    element.each(function (index, option) {
                        if (option.checked) {
                            value = $(option).val();
                        }
                    });
                }
                that.applier.change(binding.path, value);
            });

            // Update the form elements when the model changes
            that.applier.modelChanged.addListener(binding.path, function (change) {
                console.log("Changing value based on model update.");

                if (binding.elementType === "radio") {
                    binder.setRadioValue(element, change);
                }
                else {
                    element.val(change);
                }
            });
        });
    };
})(jQuery);


