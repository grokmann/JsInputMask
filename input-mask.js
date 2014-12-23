var InputMaskDefaultMask = new (function() {
    return {
        Date: "99/99/9999",
        DateTime: "99/99/9999 99:99:99",
        DateTimeShort: "99/99/9999 99:99",
        Time: "99:99:99",
        TimeShort: "99:99",
        Ssn: "999-99-9999",
        Phone: "(999) 999-9999"
    };
});

var InputMaskDataType = new (function() {
    return {
        Date: 1,
        DateTime: 2,
        DateTimeShort: 3,
        Time: 4,
        TimeShort: 5
    };
});

var InputMask = (function() {
    "use strict";

    var formatCharacters = ["-", "_", "(", ")", "[", "]", ":", ".", ",", "$", "%", "@", " ", "/"];

    var maskCharacters = ["A", "9", "*"];

    var mask = null;

    var forceUpper = false;

    var forceLower = false;

    var useEnterKey = false;

    var validateDataType = false;

    var dataType = null;

    var keys = {
        asterisk: 42,
        zero: 48,
        nine: 57,
        a: 65,
        z: 90,
        backSpace: 8,
        tab: 9,
        delete: 46,
        left: 37,
        right: 39,
        end: 35,
        home: 36,
        numberPadZero: 96,
        numberPadNine: 105,
        shift: 16,
        enter: 13,
        control: 17,
        v: 86,
        c: 67,
        x: 88
    };

    var getCursorPosition = function(element) {
        var position = 0;

        if (document.selection) {
            element.focus();

            var selectRange = document.selection.createRange();

            selectRange.moveStart("character", -element.value.length);

            position = selectRange.text.length;
        } else if (element.selectionStart || element.selectionStart === "0") {
            position = element.selectionStart;
        }

        return position;
    };

    var between = function(x, a, b) {
        return x && a && b && x >= a && x <= b;
    };

    var isValidCharacter = function(keyCode, maskCharacter) {
        var maskCharacterCode = maskCharacter.charCodeAt(0);

        if (maskCharacterCode === keys.asterisk) {
            return true;
        }

        var isNumber = (keyCode >= keys.zero && keyCode <= keys.nine) ||
        (keyCode >= keys.numberPadZero && keyCode <= keys.numberPadNine);

        if (maskCharacterCode === keys.nine && isNumber) {
            return true;
        }

        if (maskCharacterCode === keys.a && keyCode >= keys.a && keyCode <= keys.z) {
            return true;
        }

        return false;
    };

    var setCursorPosition = function(element, index) {
        if (element != null) {
            if (element.createTextRange) {
                var range = element.createTextRange();

                range.move("character", index);

                range.select();
            } else {
                if (element.selectionStart) {
                    element.focus();

                    element.setSelectionRange(index, index);
                } else {
                    element.focus();
                }
            }
        }
    };

    var removeCharacterAtIndex = function(element, index) {
        if (element.value.length > 0) {
            var newElementValue = element.value.slice(0, index) + element.value.slice(index + 1);

            element.value = newElementValue;

            if (element.value.length > 0) {
                setCursorPosition(element, index);
            } else {
                element.focus();
            }
        }
    };

    var insertCharacterAtIndex = function(element, index, character) {
        var newElementValue = element.value.slice(0, index) + character + element.value.slice(index);

        element.value = newElementValue;

        if (element.value.length > 0) {
            setCursorPosition(element, index + 1);
        } else {
            element.focus();
        }
    };

    var checkAndInsertMaskCharacters = function(element, index) {
        while (true) {
            var isMaskCharacter = formatCharacters.indexOf(mask[index]) > -1;

            var maskAlreadyThere = element.value.charAt(index) === mask[index];

            if (isMaskCharacter && !maskAlreadyThere) {
                insertCharacterAtIndex(element, index, mask[index]);
            } else {
                return;
            }

            index += 1;
        }
    };

    var checkAndRemoveMaskCharacters = function(element, index, keyCode) {
        if (element.value.length > 0) {
            while (true) {
                var character = element.value.charAt(index);

                var isMaskCharacter = formatCharacters.indexOf(character) > -1;

                if (!isMaskCharacter || index === 0 || index === element.value.length) {
                    return;
                }

                removeCharacterAtIndex(element, index);

                if (keyCode === keys.backSpace) {
                    index -= 1;
                }

                if (keyCode === keys.delete) {
                    index += 1;
                }
            }
        }
    };

    var validateDataEqualsDataType = function(element, dataType) {
        if (element == null || element.value === "") {
            return;
        }

        if (between(dataType, 1, 5)) {
            var date;

            if (between(dataType, 1, 3)) {
                date = new Date(element.value);
            } else {
                date = new Date();

                var timeSegments = element.value.split(":");

                for (var i = 0; i < timeSegments.length; i++) {
                    if (timeSegments[i] > 60) {
                        element.value = "";

                        return;
                    }
                }

                var milliseconds = 0;

                if (timeSegments[0]) {
                    milliseconds = timeSegments[0] * 3600000;
                }

                if (timeSegments[1]) {
                    milliseconds += timeSegments[1] * 60000;
                }

                if (timeSegments[2]) {
                    milliseconds += timeSegments[1] * 1000;
                }

                date.setTime(milliseconds);
            }

            if (between(dataType, 1, 3)) {
                if (isNaN(date.getDate()) || date.getFullYear() <= 1000) {
                    element.value = "";

                    return;
                }
            }

            if (dataType > 1) {
                if (isNaN(date.getTime())) {
                    element.value = "";

                    return;
                }
            }
        }
    }

    var onLostFocus = function(element) {
        if (element.value.length > 0) {
            if (element.value.length !== mask.length) {
                element.value = "";

                return;
            }

            for (var i = 0; i < element.value; i++) {
                var elementCharacter = element.value.charAt(i);
                var maskCharacter = mask[i];

                if (maskCharacters.indexOf(maskCharacter) > -1) {
                    if (elementCharacter === maskCharacter || maskCharacter.charCodeAt(0) === keys.asterisk) {
                        continue;
                    } else {
                        element.value = "";

                        return;
                    }
                } else {
                    if (maskCharacter.charCodeAt(0) === keys.a) {
                        if (elementCharacter.charCodeAt(0) <= keys.a || elementCharacter >= keys.z) {
                            element.value = "";

                            return;
                        }
                    } else if (maskCharacter.charCodeAt(0) === keys.nine) {
                        if (elementCharacter.charCodeAt(0) <= keys.zero || elementCharacter >= keys.nine) {
                            element.value = "";

                            return;
                        }
                    }
                }
            }

            if (validateDataType && dataType) {
                validateDataEqualsDataType(element, dataType);
            }
        }
    };

    var getFormattedDateTime = function(date) {
        var dateToParse = date || new Date();
        var day = dateToParse.getDate().toString().length === 1 ? "0" + dateToParse.getDate() : dateToParse.getDate();
        var month = (dateToParse.getMonth() + 1).toString().length === 1 ? "0" + (dateToParse.getMonth() + 1) : (dateToParse.getMonth() + 1);
        var year = dateToParse.getFullYear();
        var hours = dateToParse.getHours().toString().length === 1 ? "0" + dateToParse.getHours() : dateToParse.getHours();
        var minutes = dateToParse.getMinutes().toString().length === 1 ? "0" + dateToParse.getMinutes() : dateToParse.getMinutes();
        var seconds = dateToParse.getSeconds().toString().length === 1 ? "0" + dateToParse.getSeconds() : dateToParse.getSeconds();

        switch (dataType) {
        case 1:
            return month + "/" + day + "/" + year;
        case 2:
            return month + "/" + day + "/" + year + " " + hours + ":" + minutes + ":" + seconds;
        case 3:
            return month + "/" + day + "/" + year + " " + hours + ":" + minutes;
        case 4:
            return hours + ":" + minutes + ":" + seconds;
        case 5:
            return hours + ":" + minutes;
        default:
            return "";
        }
    };

    var onKeyDown = function(element, event) {
        var keyCode = event.which;

        var copyCutPasteKeys = [keys.v, keys.c, keys.x].indexOf(keyCode) > -1 && event.ctrlKey;

        var movementKeys = [keys.left, keys.right, keys.tab].indexOf(keyCode) > -1;

        var modifierKeys = event.ctrlKey || event.shiftKey;

        if (copyCutPasteKeys || movementKeys || modifierKeys) {

            return true;
        }

        if (element.selectionStart === 0 && element.selectionEnd === element.value.length) {
            element.value = "";
        }

        if (keyCode === keys.backSpace || keyCode === keys.delete) {
            if (keyCode === keys.backSpace) {
                checkAndRemoveMaskCharacters(element, getCursorPosition(element) - 1, keyCode);

                removeCharacterAtIndex(element, getCursorPosition(element) - 1);
            }

            if (keyCode === keys.delete) {
                checkAndRemoveMaskCharacters(element, getCursorPosition(element), keyCode);

                removeCharacterAtIndex(element, getCursorPosition(element));
            }

            event.preventDefault();

            return false;
        }

        if (dataType && useEnterKey && keyCode === keys.enter) {
            if (dataType >= 1 && dataType <= 5) {
                element.value = getFormattedDateTime();
            }

            event.preventDefault();

            return false;
        }

        if (element.value.length === mask.length) {
            event.preventDefault();

            return false;
        }

        checkAndInsertMaskCharacters(element, getCursorPosition(element));

        if (isValidCharacter(keyCode, mask[getCursorPosition(element)])) {
            if (keyCode >= keys.numberPadZero && keyCode <= keys.numberPadNine) {
                keyCode = keyCode - 48;
            }

            var character = event.shiftKey
                ? String.fromCharCode(keyCode).toUpperCase()
                : String.fromCharCode(keyCode).toLowerCase();

            if (forceUpper) {
                character = character.toUpperCase();
            }

            if (forceLower) {
                character = character.toLowerCase();
            }

            insertCharacterAtIndex(element, getCursorPosition(element), character);

            checkAndInsertMaskCharacters(element, getCursorPosition(element));
        }

        event.preventDefault();

        return false;
    };

    var onPaste = function(element, event, data) {
        var pastedText = "";

        if (event != null && window.clipboardData && window.clipboardData.getData) {
            pastedText = window.clipboardData.getData("text");
        } else if (event != null && event.clipboardData && event.clipboardData.getData) {
            pastedText = event.clipboardData.getData("text/plain");
        } else if (data != null && data !== "") {
            pastedText = data;
        }

        if (pastedText != null && pastedText !== "") {
            var pastedCharacters = pastedText.replace(" ", "").split("");

            for (var i = 0; i < pastedCharacters.length; i++) {
                if (formatCharacters.indexOf(pastedCharacters[i]) > -1) {
                    continue;
                }

                var keyDownEvent = document.createEventObject ? document.createEventObject() : document.createEvent("Events");

                if (keyDownEvent.initEvent) {
                    keyDownEvent.initEvent("keydown", true, true);
                }

                keyDownEvent.keyCode = keyDownEvent.which = pastedCharacters[i].charCodeAt(0);

                element.dispatchEvent ? element.dispatchEvent(keyDownEvent) : element.fireEvent("onkeydown", keyDownEvent);
            }
        }

        return false;
    };

    var formatWithMask = function(element) {
        var value = element.value;

        if (between(dataType, 1, 5)) {
            value = getFormattedDateTime(new Date(element.value));
        }

        element.value = "";

        if (value != null && value !== "") {
            onPaste(element, null, value);
        }
    };

    return {
        Initialize: function(elements, options) {
            if (!elements || !options) {
                return;
            }

            if (options.mask) {
                mask = options.mask.split("");
            }

            if (options.forceUpper) {
                forceUpper = options.forceUpper;
            }

            if (options.forceLower) {
                forceLower = options.forceLower;
            }

            if (options.validateDataType) {
                validateDataType = options.validateDataType;
            }

            if (options.dataType) {
                dataType = options.dataType;
            }

            if (options.useEnterKey) {
                useEnterKey = options.useEnterKey;
            }

            [].forEach.call(elements, function(element) {
                element.onblur = function() {
                    if (!element.getAttribute("readonly")) {
                        return onLostFocus(element);
                    }

                    return true;
                };

                element.onkeydown = function(event) {
                    if (!element.getAttribute("readonly")) {
                        return onKeyDown(element, event);
                    }

                    return true;
                };

                element.onpaste = function(event) {
                    if (!element.getAttribute("readonly")) {
                        return onPaste(element, event, null);
                    }

                    return true;
                }

                if (options.placeHolder) {
                    element.setAttribute("placeholder", options.placeHolder);
                }

                if (element.value.length > 0 && mask && mask.length > 0) {
                    formatWithMask(element);
                }
            });
        }
    };
});